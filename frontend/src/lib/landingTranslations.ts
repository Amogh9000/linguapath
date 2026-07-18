export type SiteLang =
  | 'English'
  | 'Spanish'
  | 'French'
  | 'German'
  | 'Japanese'
  | 'Italian'
  | 'Portuguese';

export const SITE_LANGUAGES: SiteLang[] = [
  'English',
  'Spanish',
  'French',
  'German',
  'Japanese',
  'Italian',
  'Portuguese',
];

export type FooterColumn = {
  title: string;
  links: string[];
};

export type LandingCopy = {
  siteLanguage: string;
  headline: string;
  getStarted: string;
  alreadyHaveAccount: string;
  backedByScience: string;
  backedByScienceBody: string;
  stayMotivated: string;
  stayMotivatedBody: string;
  learnAnywhere: string;
  learnAnywhereBody: string;
  footerCourses: string[];
  footerColumns: FooterColumn[];
  copyright: string;
};

const enFooter: FooterColumn[] = [
  {
    title: 'About us',
    links: ['Courses', 'Mission', 'Approach', 'Research', 'Careers', 'Press', 'Contact us'],
  },
  {
    title: 'Products',
    links: ['LinguaPath', 'LinguaPath for Schools', 'Super LinguaPath', 'Gift Super', 'Practice Hub'],
  },
  {
    title: 'Apps',
    links: ['LinguaPath for Android', 'LinguaPath for iOS'],
  },
  {
    title: 'Help and support',
    links: ['FAQs', 'Schools FAQs', 'Status'],
  },
  {
    title: 'Privacy and terms',
    links: ['Community guidelines', 'Terms', 'Privacy'],
  },
  {
    title: 'Social',
    links: ['Blog', 'Instagram', 'TikTok', 'YouTube', 'X'],
  },
];

export const landingTranslations: Record<SiteLang, LandingCopy> = {
  English: {
    siteLanguage: 'Site language:',
    headline: 'The free, fun, and effective way to learn a language!',
    getStarted: 'Get Started',
    alreadyHaveAccount: 'I already have an account',
    backedByScience: 'Backed by science',
    backedByScienceBody:
      'We use a combination of research-backed teaching methods and delightful content to create courses that effectively teach reading, writing, listening, and speaking skills!',
    stayMotivated: 'Stay motivated',
    stayMotivatedBody:
      'We make it easy to form a habit of language learning with game-like features, fun challenges, and reminders from our friendly mascot.',
    learnAnywhere: 'Learn anywhere',
    learnAnywhereBody:
      'Take your learning with you. Practice on your phone, tablet, or desktop whenever you have a free moment. Your progress syncs flawlessly across all your devices.',
    footerCourses: [
      'Spanish', 'French', 'Japanese', 'German', 'Korean',
      'Italian', 'Chinese', 'Russian', 'Arabic', 'Portuguese',
    ],
    footerColumns: enFooter,
    copyright: '© 2026 LinguaPath Inc.',
  },
  Spanish: {
    siteLanguage: 'Idioma del sitio:',
    headline: '¡La forma gratuita, divertida y efectiva de aprender un idioma!',
    getStarted: 'Empezar',
    alreadyHaveAccount: 'Ya tengo una cuenta',
    backedByScience: 'Respaldado por la ciencia',
    backedByScienceBody:
      'Usamos una combinación de métodos de enseñanza respaldados por investigación y contenido divertido para crear cursos que enseñan a leer, escribir, escuchar y hablar de verdad.',
    stayMotivated: 'Mantente motivado',
    stayMotivatedBody:
      'Facilitamos el hábito de aprender idiomas con funciones de juego, desafíos divertidos y recordatorios de nuestra mascota.',
    learnAnywhere: 'Aprende en cualquier lugar',
    learnAnywhereBody:
      'Lleva tu aprendizaje contigo. Practica en el teléfono, la tablet o el escritorio cuando tengas un momento libre. Tu progreso se sincroniza en todos tus dispositivos.',
    footerCourses: [
      'Español', 'Francés', 'Japonés', 'Alemán', 'Coreano',
      'Italiano', 'Chino', 'Ruso', 'Árabe', 'Portugués',
    ],
    footerColumns: [
      { title: 'Sobre nosotros', links: ['Cursos', 'Misión', 'Método', 'Investigación', 'Empleo', 'Prensa', 'Contacto'] },
      { title: 'Productos', links: ['LinguaPath', 'LinguaPath para Escuelas', 'Super LinguaPath', 'Regalar Super', 'Centro de práctica'] },
      { title: 'Apps', links: ['LinguaPath para Android', 'LinguaPath para iOS'] },
      { title: 'Ayuda', links: ['Preguntas frecuentes', 'FAQ escuelas', 'Estado'] },
      { title: 'Privacidad y términos', links: ['Normas de la comunidad', 'Términos', 'Privacidad'] },
      { title: 'Social', links: ['Blog', 'Instagram', 'TikTok', 'YouTube', 'X'] },
    ],
    copyright: '© 2026 LinguaPath Inc.',
  },
  French: {
    siteLanguage: 'Langue du site :',
    headline: 'La façon gratuite, amusante et efficace d’apprendre une langue !',
    getStarted: 'Commencer',
    alreadyHaveAccount: "J'ai déjà un compte",
    backedByScience: 'Fondé sur la science',
    backedByScienceBody:
      'Nous combinons des méthodes d’enseignement validées par la recherche et un contenu ludique pour créer des cours qui enseignent vraiment à lire, écrire, écouter et parler !',
    stayMotivated: 'Reste motivé',
    stayMotivatedBody:
      'Nous facilitons l’habitude d’apprendre une langue grâce à des fonctionnalités de jeu, des défis amusants et les rappels de notre mascotte.',
    learnAnywhere: 'Apprends partout',
    learnAnywhereBody:
      'Emporte ton apprentissage partout. Entraîne-toi sur téléphone, tablette ou ordinateur dès que tu as un moment. Ta progression se synchronise sur tous tes appareils.',
    footerCourses: [
      'Espagnol', 'Français', 'Japonais', 'Allemand', 'Coréen',
      'Italien', 'Chinois', 'Russe', 'Arabe', 'Portugais',
    ],
    footerColumns: [
      { title: 'À propos', links: ['Cours', 'Mission', 'Approche', 'Recherche', 'Carrières', 'Presse', 'Contact'] },
      { title: 'Produits', links: ['LinguaPath', 'LinguaPath pour les écoles', 'Super LinguaPath', 'Offrir Super', 'Espace pratique'] },
      { title: 'Apps', links: ['LinguaPath pour Android', 'LinguaPath pour iOS'] },
      { title: 'Aide', links: ['FAQ', 'FAQ écoles', 'Statut'] },
      { title: 'Confidentialité', links: ['Règles de la communauté', 'Conditions', 'Confidentialité'] },
      { title: 'Social', links: ['Blog', 'Instagram', 'TikTok', 'YouTube', 'X'] },
    ],
    copyright: '© 2026 LinguaPath Inc.',
  },
  German: {
    siteLanguage: 'Seitensprache:',
    headline: 'Der kostenlose, spaßige und effektive Weg, eine Sprache zu lernen!',
    getStarted: 'Loslegen',
    alreadyHaveAccount: 'Ich habe bereits ein Konto',
    backedByScience: 'Wissenschaftlich fundiert',
    backedByScienceBody:
      'Wir kombinieren forschungsbasierte Lehrmethoden mit unterhaltsamen Inhalten, um Kurse zu erstellen, die Lesen, Schreiben, Hören und Sprechen wirklich vermitteln!',
    stayMotivated: 'Motiviert bleiben',
    stayMotivatedBody:
      'Wir machen es leicht, eine Lerngewohnheit aufzubauen – mit spielerischen Features, lustigen Challenges und Erinnerungen von unserem Maskottchen.',
    learnAnywhere: 'Überall lernen',
    learnAnywhereBody:
      'Nimm dein Lernen mit. Übe auf dem Handy, Tablet oder Computer, wann immer du Zeit hast. Dein Fortschritt synchronisiert sich auf allen Geräten.',
    footerCourses: [
      'Spanisch', 'Französisch', 'Japanisch', 'Deutsch', 'Koreanisch',
      'Italienisch', 'Chinesisch', 'Russisch', 'Arabisch', 'Portugiesisch',
    ],
    footerColumns: [
      { title: 'Über uns', links: ['Kurse', 'Mission', 'Ansatz', 'Forschung', 'Karriere', 'Presse', 'Kontakt'] },
      { title: 'Produkte', links: ['LinguaPath', 'LinguaPath für Schulen', 'Super LinguaPath', 'Super verschenken', 'Übungszentrum'] },
      { title: 'Apps', links: ['LinguaPath für Android', 'LinguaPath für iOS'] },
      { title: 'Hilfe', links: ['FAQ', 'Schulen-FAQ', 'Status'] },
      { title: 'Datenschutz', links: ['Community-Richtlinien', 'AGB', 'Datenschutz'] },
      { title: 'Social', links: ['Blog', 'Instagram', 'TikTok', 'YouTube', 'X'] },
    ],
    copyright: '© 2026 LinguaPath Inc.',
  },
  Japanese: {
    siteLanguage: 'サイトの言語：',
    headline: '無料で楽しく、効果的に言語を学べる方法！',
    getStarted: 'はじめる',
    alreadyHaveAccount: 'すでにアカウントを持っています',
    backedByScience: '科学に基づく学習',
    backedByScienceBody:
      '研究に裏打ちされた指導法と楽しいコンテンツを組み合わせ、読む・書く・聞く・話す力をしっかり身につけるコースを作っています！',
    stayMotivated: 'モチベーションをキープ',
    stayMotivatedBody:
      'ゲームのような機能、楽しいチャレンジ、マスコットからのリマインダーで、言語学習の習慣づくりをかんたんにします。',
    learnAnywhere: 'どこでも学べる',
    learnAnywhereBody:
      '学習を持ち歩きましょう。スマホ、タブレット、パソコンで空き時間に練習。進捗はすべてのデバイスでしっかり同期されます。',
    footerCourses: [
      'スペイン語', 'フランス語', '日本語', 'ドイツ語', '韓国語',
      'イタリア語', '中国語', 'ロシア語', 'アラビア語', 'ポルトガル語',
    ],
    footerColumns: [
      { title: '会社情報', links: ['コース', 'ミッション', '学習法', '研究', '採用', 'プレス', 'お問い合わせ'] },
      { title: 'プロダクト', links: ['LinguaPath', '学校向け', 'Super LinguaPath', 'Superを贈る', '練習ハブ'] },
      { title: 'アプリ', links: ['Android版', 'iOS版'] },
      { title: 'ヘルプ', links: ['よくある質問', '学校向けFAQ', 'ステータス'] },
      { title: 'プライバシー', links: ['コミュニティガイドライン', '利用規約', 'プライバシー'] },
      { title: 'ソーシャル', links: ['ブログ', 'Instagram', 'TikTok', 'YouTube', 'X'] },
    ],
    copyright: '© 2026 LinguaPath Inc.',
  },
  Italian: {
    siteLanguage: 'Lingua del sito:',
    headline: 'Il modo gratuito, divertente ed efficace per imparare una lingua!',
    getStarted: 'Inizia',
    alreadyHaveAccount: 'Ho già un account',
    backedByScience: 'Basato sulla scienza',
    backedByScienceBody:
      'Usiamo metodi didattici supportati dalla ricerca e contenuti coinvolgenti per creare corsi che insegnano davvero a leggere, scrivere, ascoltare e parlare!',
    stayMotivated: 'Resta motivato',
    stayMotivatedBody:
      'Rendi facile creare l’abitudine di imparare una lingua con funzioni da gioco, sfide divertenti e promemoria della nostra mascotte.',
    learnAnywhere: 'Impara ovunque',
    learnAnywhereBody:
      'Porta l’apprendimento con te. Esercitati su telefono, tablet o computer quando hai un momento libero. I progressi si sincronizzano su tutti i dispositivi.',
    footerCourses: [
      'Spagnolo', 'Francese', 'Giapponese', 'Tedesco', 'Coreano',
      'Italiano', 'Cinese', 'Russo', 'Arabo', 'Portoghese',
    ],
    footerColumns: [
      { title: 'Chi siamo', links: ['Corsi', 'Missione', 'Approccio', 'Ricerca', 'Lavora con noi', 'Stampa', 'Contatti'] },
      { title: 'Prodotti', links: ['LinguaPath', 'LinguaPath per le scuole', 'Super LinguaPath', 'Regala Super', 'Hub pratica'] },
      { title: 'App', links: ['LinguaPath per Android', 'LinguaPath per iOS'] },
      { title: 'Aiuto', links: ['FAQ', 'FAQ scuole', 'Stato'] },
      { title: 'Privacy', links: ['Linee guida', 'Termini', 'Privacy'] },
      { title: 'Social', links: ['Blog', 'Instagram', 'TikTok', 'YouTube', 'X'] },
    ],
    copyright: '© 2026 LinguaPath Inc.',
  },
  Portuguese: {
    siteLanguage: 'Idioma do site:',
    headline: 'A forma gratuita, divertida e eficaz de aprender um idioma!',
    getStarted: 'Começar',
    alreadyHaveAccount: 'Já tenho uma conta',
    backedByScience: 'Com base na ciência',
    backedByScienceBody:
      'Usamos uma combinação de métodos de ensino baseados em pesquisa e conteúdo divertido para criar cursos que ensinam de verdade a ler, escrever, ouvir e falar!',
    stayMotivated: 'Fique motivado',
    stayMotivatedBody:
      'Facilitamos o hábito de aprender idiomas com recursos de jogo, desafios divertidos e lembretes do nosso mascote.',
    learnAnywhere: 'Aprenda em qualquer lugar',
    learnAnywhereBody:
      'Leve o aprendizado com você. Pratique no celular, tablet ou computador sempre que tiver um tempinho. Seu progresso sincroniza em todos os dispositivos.',
    footerCourses: [
      'Espanhol', 'Francês', 'Japonês', 'Alemão', 'Coreano',
      'Italiano', 'Chinês', 'Russo', 'Árabe', 'Português',
    ],
    footerColumns: [
      { title: 'Sobre nós', links: ['Cursos', 'Missão', 'Método', 'Pesquisa', 'Carreiras', 'Imprensa', 'Contato'] },
      { title: 'Produtos', links: ['LinguaPath', 'LinguaPath para escolas', 'Super LinguaPath', 'Presentear Super', 'Hub de prática'] },
      { title: 'Apps', links: ['LinguaPath para Android', 'LinguaPath para iOS'] },
      { title: 'Ajuda', links: ['FAQ', 'FAQ escolas', 'Status'] },
      { title: 'Privacidade', links: ['Diretrizes da comunidade', 'Termos', 'Privacidade'] },
      { title: 'Social', links: ['Blog', 'Instagram', 'TikTok', 'YouTube', 'X'] },
    ],
    copyright: '© 2026 LinguaPath Inc.',
  },
};
