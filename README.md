# AI Sailboat Image Augmentor

Esta aplicação foi desenvolvida para aumentar datasets de imagens de veleiros, adicionando obstáculos e modificando condições ambientais através de inteligência artificial. O objetivo é criar um dataset variado e robusto para treinar sistemas de anti-colisão para veleiros robóticos autônomos (USVs).

## Principais Funcionalidades

-   **Upload de Múltiplas Imagens-Base:** Inicie o processo com um ou mais exemplos de imagens.
-   **Geração de Variações de Cenário:** Modifique o clima, a iluminação e o estado do mar.
-   **Injeção de Obstáculos:** Adicione uma vasta gama de obstáculos realistas à cena.
-   **Extração Automática de Metadados:** Gere automaticamente anotações, incluindo caixas delimitadoras (bounding boxes) no formato COCO.
-   **Classificação de Atributos da Imagem:** Classifique o estado do mar e identifique "exemplos difíceis" para cenários de treino mais desafiadores.
-   **Aplicação de Perturbações:** Adicione perturbações do mundo real, como compressão JPEG, ruído e desfoque, para aumentar a robustez do modelo.
-   **Exportação em Lote:** Faça o download de todo o dataset (imagens + anotações em `annotations.json`) em um único arquivo `.zip`.

---

## Fluxo de Trabalho do Pipeline de Aumento de Dados Sintéticos

O sistema opera como um pipeline sequencial para o aumento de datasets de imagens, utilizando um modelo de visão generativa (Gemini 2.5 Flash Image Preview) para síntese e um modelo multimodal (Gemini 2.5 Flash) para análise e verificação.

O processo é estruturado nas seguintes fases:

1.  **Ingestão de Dados (Input):**
    -   O processo é iniciado com o carregamento de um conjunto de imagens-semente (seed images) que servem como base para a geração de variações.

2.  **Parametrização da Geração (Configuration):**
    -   O usuário define um conjunto de heurísticas de aumento, que incluem:
        -   **Injeção de Objetos:** Seleção de obstáculos a serem realisticamente integrados na cena. Para cada obstáculo, são configuradas múltiplas variações baseadas em modificadores de posição, escala e visibilidade (e.g., no horizonte, parcialmente na borda, em proximidade).
        -   **Modulação de Cenário:** Alteração das condições ambientais, incluindo o estado do mar (sea state), condições atmosféricas (e.g., neblina, chuva) e iluminação (e.g., amanhecer, visão noturna infravermelha).

3.  **Fase de Síntese e Análise (Generation & Analysis Loop):**
    -   O pipeline itera sobre cada imagem-semente e cada permutação de cenário definida.
    -   **Geração de Cenário Base:** Inicialmente, uma nova imagem base é sintetizada aplicando as condições de cenário (estado do mar, clima, etc.) à imagem original.
    -   **Verificação de Preservação (Opcional):** Após a geração do cenário, um módulo de verificação utiliza o modelo multimodal para comparar a imagem original com a modificada, garantindo que o objeto principal (o veleiro) não foi corrompido ou removido. Variações que falham nesta verificação são descartadas para manter a integridade semântica do dataset.
    -   **Injeção de Obstáculos:** Utilizando a imagem base (original ou modificada), o sistema itera sobre os prompts de obstáculos, gerando uma nova imagem para cada um.
    -   **Geração de Anotações (Metadata Generation):**
        -   **Caixas Delimitadoras (Bounding Boxes):** Após a injeção de um obstáculo, é realizada uma análise diferencial entre a imagem pré e pós-injeção para extrair automaticamente a caixa delimitadora do objeto adicionado em formato COCO.
        -   **Classificação de Atributos:** O modelo multimodal é empregado para classificar atributos da imagem final, como o estado do mar (escala de 1 a 4).
        -   **Avaliação de "Exemplos Difíceis" (Hard Examples):** Opcionalmente, cada imagem com obstáculo é avaliada para determinar se constitui um "exemplo difícil" (e.g., com oclusão parcial ou baixa proeminência do objeto principal), permitindo a curadoria de dados para cenários de detecção mais desafiadores.

4.  **Pós-processamento e Perturbações (Post-processing):**
    -   Sobre as imagens sintetizadas, podem ser aplicadas perturbações do mundo real, como compressão JPEG, ruído Gaussiano e desfoque, para aumentar a robustez do modelo a ser treinado com estes dados.

5.  **Empacotamento (Output):**
    -   O resultado final é um arquivo `.zip` contendo:
        -   O conjunto completo de imagens aumentadas.
        -   Um arquivo `annotations.json` que cataloga cada imagem com seus metadados correspondentes: prompt de geração, anotações de caixa delimitadora, classificação do estado do mar e outros atributos derivados.

---

## Tipos de Variações Geradas

A API é capaz de gerar uma ampla gama de variações para criar um dataset diversificado.

### Obstáculos

-   **Embarcações:** Barco de pesca, Lancha, Navio de carga, Caiaque, Prancha de stand-up paddle, Jet ski, Outro veleiro.
-   **Vida Marinha:** Baleia, Grupo de golfinhos, Tartaruga marinha.
-   **Detritos e Perigos:** Contêiner semi-submerso, Tronco de árvore, Rede de pesca, Mancha de lixo.
-   **Formações Naturais e Sinalização:** Rochas, Pequeno iceberg, Recife de coral, Boias de navegação (vermelha e amarela).

### Condições do Mar (Sea States)

-   **Estado 1:** Mar calmo, como um espelho.
-   **Estado 2:** Mar com pequenas ondas.
-   **Estado 3:** Mar com ondas moderadas.
-   **Estado 4:** Mar agitado com ondas grandes e céu de tempestade.

### Hora do Dia e Iluminação

-   Amanhecer
-   Meio-dia com sol forte
-   Pôr do sol
-   Crepúsculo
-   Noite de luar
-   Noite escura
-   Hora dourada
-   Visão noturna infravermelha (estilo FLIR)

### Condições Climáticas

-   Céu limpo
-   Dia nublado
-   Neblina densa
-   Chuva leve
-   Tempestade com céu escuro

## Tecnologias Utilizadas

-   **Frontend:** React, TypeScript, Tailwind CSS
-   **IA (Google Gemini):**
    -   **`gemini-2.5-flash-image-preview`**: Para a geração e edição de imagens.
    -   **`gemini-2.5-flash`**: Para análise de imagem, classificação de atributos e extração de metadados.

## Como Rodar Localmente

Para executar esta aplicação no seu computador, siga os passos abaixo.

### Pré-requisitos

-   [Node.js](https://nodejs.org/) (versão 18 ou superior)
-   [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)

### Passos para Instalação

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/seu-usuario/seu-repositorio.git
    cd seu-repositorio
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```
    ou
    ```bash
    yarn install
    ```

3.  **Configure a Chave da API:**
    -   Crie um arquivo chamado `.env` na raiz do projeto.
    -   Adicione a seguinte linha ao arquivo `.env`, substituindo `SUA_CHAVE_API` pela sua chave da API do Google Gemini, que pode ser obtida no [Google AI Studio](https://aistudio.google.com/app/apikey):
        ```
        API_KEY=SUA_CHAVE_API
        ```
    *Importante: A aplicação depende desta variável de ambiente para funcionar.*

4.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm start
    ```
    ou
    ```bash
    yarn start
    ```

5.  **Acesse a aplicação:**
    Abra o seu navegador e acesse `http://localhost:3000` (ou a porta indicada no seu terminal).
