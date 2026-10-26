# Eco

Eco é uma plataforma social dedicada a amantes de música que transforma o ato diário de ouvir canções num diário vivo e partilhado. Ao registar de forma automática o histórico de escutas, o espaço pessoal de cada utilizador acompanha sem esforço todos os álbuns ouvidos, permitindo atribuir classificações, destacar faixas favoritas e escrever críticas detalhadas ou breves impressões sobre cada lançamento. O perfil individual funciona como uma verdadeira identidade musical, oferecendo um lugar de destaque para os quatro álbuns de eleição de sempre, além de organizar o histórico de reproduções ao longo do tempo. Para além do registo pessoal, o Eco incentiva a descoberta contínua através da comunidade, permitindo seguir amigos e entusiastas, explorar seleções temáticas criadas por outros membros, acompanhar os lançamentos mais recentes e participar em discussões sobre os discos do momento. Toda esta experiência completa-se com a criação automática de cartões visuais personalizados com as avaliações e hábitos de escuta, prontos a partilhar com amigos e nas redes sociais.

## 1. Arquitetura Técnica & Stack Recomendada

### **Frontend & Framework**

* **React** (utilizando **Next.js** com App Router): Fundamental para garantir **Server-Side Rendering (SSR)** e **SEO**, permitindo que cada página de álbum, review e perfil seja indexada pelos motores de busca.
* **Tailwind CSS**: Ideal para rápida estilização e implementação do design *mobile-first*.
* **Lucide React / Heroicons**: Biblioteca de ícones leve e moderna.
* **Framer Motion**: Para animações fluidas no mobile (transições de ecrã, fecho de modais, *bottom sheets*).

### **Backend & Base de Dados (Firebase)**

* **Firebase Authentication**: Autenticação com Google, Spotify e Email/Password.
* **Cloud Firestore**: Base de dados NoSQL flexível para armazenar utilizadores, reviews, listas, gostos e histórico de audições (*logs*).
* **Firebase Cloud Functions**: Para lidar com tarefas em segundo plano (ex.: sincronização periódica de *scrobbles* com Last.fm/Spotify, recalcular médias de ratings).
* **Firebase Hosting**: Alojamento de alto rendimento com suporte a Next.js.

### **APIs de Música (Fontes de Dados)**

* **Spotify Web API**: Principal fonte para metadados (álbuns, capas em alta resolução, artistas, faixas) e autenticação de escuta em tempo real.
* **Last.fm API**: Para importar dados históricos de escuta (*scrobbles*) e estatísticas globais de reprodução.
* **MusicBrainz / Cover Art Archive** *(Opcional/Backup)*: Fonte aberta de metadados para álbuns ou edições não disponíveis no Spotify.


---


## 2. Mapeamento de Ecrãs (Screens & Views)

### **Ecrã 1: Feed / Home Page**

O ecrã principal deve funcionar como a rede social do utilizador.

* **Cabeçalho (*Header*)**:
* Logótipo e pesquisa rápida.
* Botão de login / Foto de perfil com aceso rápido ao menu.

* **Barra de Abas (*Feed Toggle*)**:
* **Acompanhar (Following)**: Atividade dos amigos que o utilizador segue.
* **Descobrir (Popular/Global)**: O que a comunidade global está a ouvir e a avaliar.

* **Módulos do Feed**:
* **Lançamentos da Semana**: Carrossel horizontal de novos álbuns e EPs.
* **Atividade Recente**: Cartões de *reviews* e *logs* recentes com capa do álbum, classificação por estrelas (0.5 a 5.0), excerto do texto e avatar do autor.
* **Listas em Destaque**: Seleção de listas criadas pela comunidade (ex.: *"Os melhores álbuns de Synthwave de 2026"*).


### **Ecrã 2: Pesquisa & Descoberta**

O motor de pesquisa central e explorador de catálogo.

* **Barra de Pesquisa Global**:
* Procura em tempo real por Álbuns, Artistas, Músicas, Utilizadores e Listas.

* **Filtros e Categorias (*Explorar*)**:
* Filtro por Década / Ano, Género Musical, Tipo de Lançamento (Álbum, EP, Single), Classificação Média.

* **Secção "Apenas Lançados"**:
* Calendário de lançamentos futuros e recentes.


### **Ecrã 3: Página do Álbum / Lançamento**

O ecrã central da aplicação, equivalente à página de um filme no Letterboxd.

* **Secção Principal (Hero)**:
* Imagem de capa em grande destaque com fundo em gradiente baseado nas cores do álbum.
* Título do Álbum, Artista(s), Ano de Lançamento e Duração Total.
* Nota Média Geral (ex.: `4.2 / 5.0`) e Histograma de Distribuição das Notas (gráfico de barras mostrando quantas pessoas deram 1, 2, 3, 4 ou 5 estrelas).

* **Ações Rápidas (CTA Bar)**:
* Botão principal **"Registar / Escrever Review"**.
* Botão de "Gosto" (Coração).
* Botão **"+ Adicionar a uma Lista"**.
* Marcador de "Na Lista de Espera / Want to Listen".

* **Alinhamento de Faixas (*Tracklist*)**:
* Lista com número da faixa, nome e duração.
* Indicador da "Faixa Mais Popular" do álbum.
* Opção de marcar faixas favoritas (*Top Tracks* daquele álbum).

* **Seção de Reviews da Comunidade**:
* Ordenação por: *Mais Populares*, *Mais Recentes*, *Apenas de Amigos*.
* Leitura completa da review, com botão de "Gosto" e área de comentários.


### **Ecrã 4: Perfil do Utilizador**

O espaço de identidade do utilizador no site.

* **Cabeçalho de Perfil**:
* Avatar, nome de utilizador, bio e estatísticas totais (Álbuns ouvidos, Reviews escritas, Listas criadas).

* **Os Meus 4 Favoritos (*Top 4 Albums*)**:
* Seleção visual dos 4 álbuns favoritos de sempre do utilizador (imagem estilo poster).

* **Diário de Audições (*Diary / Log*)**:
* Linha do tempo cronológica com capas de álbuns, data de audição, nota atribuída e indicador se tem review.

* **Sincronização Ativa**:
* Indicador *"A ouvir agora no Spotify"* ou *"Último scrobble no Last.fm há 5 min"*.

* **Separadores de Conteúdo**:
* **Reviews**: Lista de todas as críticas escritas.
* **Listas**: Listas criadas pelo utilizador.
* **Estatísticas**: Gráficos de géneros mais ouvidos no mês/ano, número de álbuns por mês, etc.


### **Ecrã 5: Modal / Bottom Sheet de Registo ("Log & Review")**

Aparece sobre o ecrã atual quando o utilizador clica em "Registar".

* **Classificação**: Seletor intuitivo por estrelas (com suporte a meias-estrelas, ex.: 3.5).
* **Data da Audição**: Pré-definida como hoje, mas editável.
* **Seleção de Faixa Favorita**: Permite escolher a música de destaque daquele álbum.
* **Caixa de Texto para Review**: Suporte para formatação simples (Markdown) e tagging de spoilers.
* **Opção de Re-audição**: Caixa de seleção para marcar se é uma releitura/re-audição.
* **Botão "Publicar e Partilhar"**: Grava os dados no Firestore e oferece geração instantânea de imagem para redes sociais.


### **Ecrã 6: Criador & Visualizador de Listas**

Permite aos utilizadores organizar e partilhar seleções temáticas.

* **Criador de Listas**:
* Título da lista e descrição.
* Campo para pesquisar e adicionar álbuns rapidamente.
* Reordenação por *drag-and-drop* (arrastar e soltar).
* Opção de lista pública ou privada.

* **Visualizador de Lista**:
* Layout em grelha visual com capas de álbuns numeradas ou em lista detalhada.
* Estatísticas da lista (duração total acumulada, nota média dos álbuns da lista).


### **Ecrã 7: Gerador de Cards Sociais (Widgets de Partilha)**

Inspirado na partilha para o Instagram Stories do Letterboxd/Spotify.

* Gera um gráfico em tela (Canvas / HTML-to-Image) com o álbum, a nota do utilizador, excerto da review e a estética visual da marca para fácil partilha no Instagram Stories ou X (Twitter).


---


## 3. Modelo de Dados no Firebase Firestore

```
/users/{userId}
  - displayName: string
  - photoURL: string
  - bio: string
  - favoriteAlbums: array [albumId1, albumId2, albumId3, albumId4]
  - lastfmUsername: string
  - spotifyConnected: boolean

/albums/{albumId}  (Cache local dos metadados da API)
  - title: string
  - artist: string
  - coverUrl: string
  - releaseDate: string
  - totalReviews: number
  - averageRating: number
  - ratingDistribution: map { "0.5": N, "1.0": N, ... "5.0": N }

/reviews/{reviewId}
  - userId: string
  - albumId: string
  - rating: number (0.5 a 5.0)
  - textContent: string
  - favoriteTrackId: string
  - listenedAt: timestamp
  - likesCount: number
  - isRewatch: boolean

/lists/{listId}
  - ownerId: string
  - title: string
  - description: string
  - albumIds: array [albumId1, albumId2...]
  - likesCount: number
  - isPublic: boolean

```


---


## 4. Estratégia de Desenvolvimento (Passo a Passo)

### **Fase 1: Configuração Base e Autenticação**

1. Inicializar projeto Next.js com Tailwind CSS.
2. Configurar o projeto no console do Firebase e instalar o SDK.
3. Criar sistema de Login/Registo com Firebase Auth (Google e Email).


### **Fase 2: Integração da API de Música**

1. Criar um serviço/wrapper em Node/Next.js para comunicar com a **Spotify Web API** (obtenção de tokens, pesquisa de álbuns, detalhes do álbum).
2. Implementar a pesquisa e a página do álbum dinâmica (`/album/[id]`).


### **Fase 3: Core das Funcionalidades Sociais**

1. Criar a estrutura do Firestore para as reviews e ratings.
2. Desenvolver o ecrã de modal de "Registar / Review".
3. Desenvolver o perfil do utilizador com os 4 álbuns favoritos e o diário de audições.


### **Fase 4: Automação e Last.fm**

1. Adicionar campo no perfil para integrar o nome de utilizador do **Last.fm**.
2. Criar uma Cloud Function ou rota de API para ir procurar os *recent tracks* do Last.fm e sincronizá-los com o diário do utilizador automaticamente.


### **Fase 5: Feed, Listas e Polimento UI/UX**

1. Desenvolver a funcionalidade de criação de listas.
2. Construir o Feed principal ( Following vs. Descobrir).
3. Otimizar a interface móvel (menu inferior fixo, animações de deslize e layouts responsivos).
4. Implementar a geração de cartões gráficos para partilha em redes sociais.