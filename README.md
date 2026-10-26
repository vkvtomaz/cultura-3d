# 🧊 Cultura 3D — Landing Page

[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://cultura-3d-landing.vercel.app/)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Three.js](https://img.shields.io/badge/Three.js-r170-20251F?style=for-the-badge&logo=threedotjs&logoColor=white)

Uma *landing page* para a **Cultura 3D**, estúdio de impressão 3D dedicado a peças autorais, chaveiros personalizados e projetos sob encomenda. A proposta é transformar a ideia de “sair da tela” em uma experiência interativa: o visitante explora uma peça tridimensional, experimenta acabamentos e acompanha a passagem do desenho ao objeto.

O projeto combina **HTML semântico, CSS responsivo e JavaScript modular**, com renderização em **Three.js**, identidade visual própria e contato direto pelo WhatsApp.

---

## Demonstração

Acesse a versão publicada do projeto: 👉 (https://cultura-3d-landing.vercel.app/)

## Pré-visualização

![Landing page da Cultura 3D no tema escuro.](docs/captura.gif)

---

## Destaques e Decisões de Design (UI/UX)

- **Identidade editorial:** composição com espaços generosos, títulos expressivos e poucos elementos decorativos, mantendo as peças como protagonistas.
- **Paleta adaptável:** fundo claro em `#F3F0E7` e escuro em `#1D211F`, com dourado como acabamento inicial. Vermelho, prata, azul e amarelo atualizam o modelo e os destaques de todas as seções.
- **Tipografia contrastante:** Space Grotesk nos títulos, DM Sans na leitura e Instrument Serif em itálico nas palavras de destaque.
- **Produto como interação:** o dragão responde ao cursor e permite giro por arraste, aproximando a navegação da experiência de observar uma peça física.
- **Vídeo integrado ao layout:** máscaras de transparência nas bordas conectam o filme ao fundo, sem controles sobrepostos.
- **Acessibilidade e movimento:** navegação por teclado, rótulos acessíveis, link para pular ao conteúdo e respeito à preferência por movimento reduzido.

---

## Funcionalidades e Componentes

1. **Visualizador 3D:** modelo GLB com iluminação de estúdio, sombras, reflexos e rotação por mouse, toque ou teclado. Uma fotografia funciona como alternativa se a cena não carregar.
2. **Simulador de acabamento:** cinco cores sincronizam o material da peça e a paleta da interface, preservando as cores das fotografias e do vídeo.
3. **Temas claro e escuro:** preferência armazenada localmente; na ausência de uma escolha, o site acompanha o tema do sistema.
4. **Comparadores de antes e depois:** duas composições com controle de arraste, toque e teclado revelam o desenho e a peça final.
5. **Filme conceitual:** reprodução automática, sem áudio e em loop na área visível. Clique, toque, Espaço ou Enter permitem pausar e retomar.
6. **FAQ animado:** abertura e fechamento com transições de altura e opacidade, preservando os elementos nativos `details` e `summary`.
7. **Formulário de encomenda:** valida os campos e prepara uma mensagem para revisão e envio pelo visitante no WhatsApp, sem backend ou armazenamento dos dados.
8. **Navegação responsiva:** menu adaptado ao celular, links para as seções e chamadas para iniciar uma encomenda.

---

## Tecnologias Utilizadas

- **HTML5:** estrutura semântica, formulários e componentes nativos.
- **CSS3:** propriedades personalizadas, Grid, Flexbox, máscaras e layouts responsivos.
- **JavaScript (ES Modules):** organização das interações em módulos independentes.
- **Three.js r170 / WebGL:** renderização do modelo, materiais, câmera e iluminação.
- **Web Animations API e Intersection Observer:** animação do FAQ e controle de visibilidade das mídias.
- **Node.js 20+:** servidor local, testes nativos e preparação da versão estática.
- **Python, NumPy e fast-simplification:** conversão opcional do STL para o modelo otimizado utilizado na página.

## Desempenho e Mídias

A malha do dragão foi reduzida de **539.716 para aproximadamente 150 mil triângulos**. Quando o navegador oferece suporte, o modelo é transferido como GLB comprimido, com cerca de **2,44 MB**. A cena renderiza sob demanda e suspende as atualizações fora da área visível.
O dragão começou como um arquivo **STL**, formato comum na impressão 3D. Para exibi-lo na página com uma transferência menor, o script [`scripts/prepare-dragon.py`](scripts/prepare-dragon.py) prepara uma versão **GLB**, formato binário do glTF.

O vídeo também pausa fora da tela e quando a aba está oculta. As fontes e a biblioteca 3D acompanham o projeto e são hospedadas junto com o site. A versão de publicação inclui todos os recursos usados na página, preservando sua aparência e funcionalidades.

---

## Como Executar

Requer **Node.js 20 ou superior**. Não é necessário instalar dependências para iniciar o site.

```sh
npm run dev
```

Abra o endereço exibido no terminal, normalmente **http://127.0.0.1:5173/**.

### Validação e build

```sh
npm run check
npm test
npm run build
```

A versão para hospedagem estática é gerada em `dist/`. Para conferi-la localmente:

```sh
node scripts/dev.mjs --dist
```

---

## Créditos

👨‍💻 **Autor:** desenvolvido por **[Vinicius Tomaz](https://github.com/vkvtomaz)**, desenvolvedor Full Stack Python, como parte do portfólio de desenvolvimento de interfaces web.
