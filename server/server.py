#coding=utf-8
import pandas as pd
import time
import tiktoken
import openai
from openai.embeddings_utils import distances_from_embeddings
from flask import Flask, request, jsonify
import os
from scipy.spatial.distance import cosine
import numpy as np
import ast



app = Flask(__name__)

dataframe = pd.DataFrame()
if 'training_embeddings.csv' in os.listdir():
    dataframe = pd.read_csv('training_embeddings.csv', index_col=0)
    def string_to_array(x):
            return np.array(ast.literal_eval(x))    
    dataframe['embedding'] = dataframe['embedding'].apply(string_to_array)

def get_api_key():
    with open('openai_key.txt', 'r') as f:
        return f.read().strip()


openai.api_key = get_api_key()
print('OpenAI API key loaded')

def train():
    filename = 'training.txt'
    print('Training with data from', filename)
    with open(filename, 'r') as f:
        data = f.read()
        data = data.lower().split('\n')
    
    dataframe = pd.DataFrame(data, columns=['text'])

    dataframe.to_csv('training.csv')
    print('Training data saved to training.csv')

    tokenizer = tiktoken.get_encoding("cl100k_base")
    dataframe = pd.read_csv('training.csv', index_col=0)
    dataframe.columns = ['text']

    dataframe['n_tokens'] = dataframe['text'].apply(lambda x: len(tokenizer.encode(str(x))))

    print('Training data loaded')

    max_tokens = 512

    def split_into_many(text, max_tokens = max_tokens):
        sentences = text.split(' ')
        n_tokens = [len(tokenizer.encode(" " + sentence)) for sentence in sentences]

        chunks = []
        tokens_so_far = 0
        chunk = []

        for sentence, token in zip(sentences, n_tokens):
            if tokens_so_far + token > max_tokens:
                chunks.append(". ".join(chunk)+ ".")
                chunk = []
                tokens_so_far = 0
        
            if token > max_tokens:
                continue

            chunk.append(sentence)
            tokens_so_far += token + 1
        
        return chunks

    shortened = []

    for row in dataframe.iterrows():
        if row[1]['text'] is None:
            continue
            
        if row[1]['n_tokens'] > max_tokens:
            shortened += split_into_many(row[1]['text'])
        else:
            shortened.append(row[1]['text'])


    dataframe = pd.DataFrame(shortened, columns=['text'])
    dataframe['n_tokens'] = dataframe['text'].apply(lambda x: len(tokenizer.encode(str(x))))

    total_tokens = dataframe['n_tokens'].sum()
    print('Total tokens:', total_tokens)
    print('total embedding cost:', total_tokens/1000 * 0.0001)




    i = 0
    embeddings = []
    for text in dataframe['text']:
        try:
            print('Creating embedding', i)
            embedding = openai.Embedding.create(input=text, engine='text-embedding-ada-002')['data'][0]['embedding']
            embeddings.append(embedding)
            time.sleep(1)
        except openai.error.RateLimitError:
            print('Rate limit reached, sleeping for 1 minute')
            time.sleep(20)
            embedding = openai.Embedding.create(input=text, engine='text-embedding-ada-002')['data'][0]['embedding']
            embeddings.append(embedding)
        i += 1
    
    print('Embeddings created')
    dataframe['embedding'] = embeddings
    dataframe.to_csv('training_embeddings.csv')
    print('Embeddings saved to training_embeddings.csv')


    

    print('Training complete')


def create_context(question, df, max_len=1800, size="ada"):
    print('Creating context for question:', question)
    q_embeddings = openai.Embedding.create(input=question, engine='text-embedding-ada-002')['data'][0]['embedding']
    
    # convert df['embedding'] from string to list
    
    
    

    # Calculate cosine distances
    df['distances'] = df['embedding'].apply(lambda x: cosine(q_embeddings, x))

    

    returns = []
    cur_len = 0

    for i, row in df.sort_values('distances', ascending=True).iterrows():
        cur_len += row['n_tokens'] + 4
        if cur_len > max_len:
            break
    
        returns.append(row['text'])

    return "\n###\n".join(returns)
    
   

def answer(question):
    context = create_context(question, dataframe)
    prompt = "Você é um assistente para o site da faculdade, seja profissional e responda as perguntas baseado no contexto abaixo, recuse educadamente caso não possa responder.{context} --- Pergunta: {question} Resposta:".format(context=context, question=question)
    try:
        response = openai.Completion.create(
            prompt=prompt,
            temperature=0.6,
            max_tokens=150,
            top_p=0.7,
            frequency_penalty=0,
            presence_penalty=0,
            stop=['###'],
            model='gpt-3.5-turbo-instruct'
        )
        print(response.choices[0].text)
        return response.choices[0].text
    except Exception as e:
        print(e)
        return 'Minha cabeça está doendo, não consigo responder a essa pergunta agora.'
    

@app.route('/answer', methods=['POST'])
def get_answer():
    question = request.json['question']
    return jsonify({'answer': answer(question)})

@app.route('/train', methods=['POST'])
def train_model():
    train()
    return jsonify({'status': 'Training complete'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=2024)