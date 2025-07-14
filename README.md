# 🚀 CryptoMail

CryptoMail é um software livre para criptografia de ponta a ponta do tráfego de e-mail dentro de um navegador web (Firefox, Chromium ou Edge) que se integra a aplicativos de webmail existentes (atualmente, só funciona com o Gmail). Ele pode ser usado para criptografar e descriptografar um e-mail sem a necessidade de um cliente de e-mail nativo separado (como o Thunderbird), ou a necessidade de contato prévio com o outro lado da comunicação, utilizando o padrão OpenPGP.

# ✅ Pré-requisitos

Antes de começar, você vai precisar ter as seguintes ferramentas instaladas em sua máquina:

[Google Chrome](https://www.google.com/intl/pt-BR/chrome/): A extensão foi desenvolvida para o navegador Google Chrome.

[Git](https://git-scm.com/downloads): Para clonar o repositório e gerenciar as versões do código.

# 🛠️ Como Instalar e Configurar (Ambiente de Desenvolvimento)

Siga este passo a passo para configurar o ambiente de desenvolvimento e testar a extensão localmente.

### Passo 1: Clonar o Repositório

Primeiro, clone a branch development do projeto para a sua máquina local.

Abra o seu terminal e execute os seguintes comandos:

```# Clone a branch de desenvolvimento diretamente
git clone -b git@github.com:DanielMoliari/seguranca-auditoria-sistemas.git

# Entre na pasta do projeto que foi criada
cd seguranca-auditoria-sistemas
```

### Passo 2: Carregar a Extensão no Google Chrome

Com o código na sua máquina, o próximo passo é carregá-lo no seu navegador.

1. Abra o Google Chrome e digite `chrome://extensions` na barra de endereço e pressione **Enter**.

2. No canto superior direito da página, ative o **Modo de Desenvolvedor** (Developer Mode).

3. Após ativar o modo desenvolvedor, novas opções aparecerão. Clique no botão **"Carregar sem compactação"** (Load unpacked).

4. Uma janela do seu sistema operacional será aberta. Navegue até a pasta do projeto que você clonou (seguranca-auditoria-sistemas) e clique em **"Selecionar Pasta"**.

5. Se tudo correu bem, a extensão aparecerá na sua lista, pronta para ser usada!

### Passo 3: Fixar e Acessar a Extensão

Para facilitar o acesso, você pode fixar a extensão na barra de ferramentas do Chrome.

1. Clique no ícone de quebra-cabeça (🧩) ao lado da barra de endereço.

2. Uma lista com suas extensões aparecerá. Encontre a **CryptoMail** e clique no ícone de pino (📌) ao lado dela.

3. Pronto! O ícone da sua extensão agora está fixado na barra de ferramentas para acesso rápido.

# 🚀 Como Usar

Agora que a extensão está instalada e visível, basta clicar em seu ícone na barra de ferramentas para começar.

![](/images/load-unpacked.png)
![](/images/my-extensions.png)
![](/images/popup-extension.png)
![](/images/home.png)
![](/images/generate-key.png)
![](/images/email-to-encrypt.png)
![](/images/email-encrypted.png)

# 🤝 Como Contribuir

Ficamos felizes com o seu interesse em contribuir! Para sugerir melhorias, siga estes passos:

1. Faça um **Fork** deste repositório.

2. Crie uma nova **Branch**: git checkout -b feature/sua-feature

3. Faça suas alterações e **Commite**: git commit -m 'Adicionando uma feature incrível'

4. Envie para o seu repositório remoto: git push origin feature/sua-feature-incrivel

5. Abra um **Pull Request**.

Obrigado por sua contribuição!
