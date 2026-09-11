export const locales = ['zh', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'zh';

export const localeNames: Record<Locale, string> = {
  zh: '中文',
  en: 'English',
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

const zh = {
  common: {
    siteName: '我的个人空间',
    readMore: '阅读全文',
    viewAll: '查看全部',
    back: '返回',
    loading: '加载中…',
    empty: '暂无内容',
    prev: '上一篇',
    next: '下一篇',
    minRead: '分钟阅读',
    views: '次浏览',
    publishedAt: '发布于',
    updatedAt: '更新于',
    search: '搜索',
    searchPlaceholder: '搜索文章标题或内容…',
    tags: '标签',
    allTags: '全部',
    noResult: '没有找到相关内容',
    copy: '复制',
    copied: '已复制',
    toc: '目录',
    share: '分享',
    relatedPosts: '相关文章',
    theme: '主题',
    language: '语言',
  },
  nav: {
    home: '首页',
    blog: '博客',
    projects: '项目',
    about: '关于',
    contact: '联系我',
    admin: '后台',
  },
  home: {
    greeting: '你好，我是',
    ctaBlog: '阅读博客',
    ctaProjects: '看看项目',
    latestPosts: '最新文章',
    featuredProjects: '精选项目',
    skills: '技能栈',
    aboutTitle: '关于我',
    stats: {
      posts: '篇文章',
      projects: '个项目',
      views: '总阅读',
    },
  },
  blog: {
    title: '博客',
    subtitle: '记录技术、思考与生活',
    allPosts: '全部文章',
    taggedWith: '标签：',
    totalPosts: '共 {count} 篇文章',
  },
  projects: {
    title: '项目',
    subtitle: '我做过的产品与技术实践',
    all: '全部',
    sourceCode: '源码',
    liveDemo: '在线体验',
    techStack: '技术栈',
    status: {
      active: '维护中',
      wip: '开发中',
      archived: '已归档',
    },
  },
  about: {
    title: '关于我',
    subtitle: '一个热爱技术与创造的人',
    contactTitle: '联系我',
    sendMessage: '发送留言',
    name: '你的称呼',
    email: '你的邮箱',
    message: '想说的话',
    submit: '提交',
    submitting: '提交中…',
    success: '留言已收到，感谢你的来信！',
    error: '提交失败，请稍后重试',
    required: '请填写完整信息',
  },
  footer: {
    rights: '保留所有权利',
    builtWith: '由 Next.js 构建',
    quickLinks: '快速导航',
    followMe: '关注我',
  },
  notFound: {
    title: '页面走丢了',
    desc: '你访问的页面不存在或已被移除',
    backHome: '回到首页',
  },
};

export type Dictionary = typeof zh;

const en: Dictionary = {
  common: {
    siteName: 'My Personal Space',
    readMore: 'Read more',
    viewAll: 'View all',
    back: 'Back',
    loading: 'Loading…',
    empty: 'Nothing here yet',
    prev: 'Previous',
    next: 'Next',
    minRead: 'min read',
    views: 'views',
    publishedAt: 'Published',
    updatedAt: 'Updated',
    search: 'Search',
    searchPlaceholder: 'Search posts by title or content…',
    tags: 'Tags',
    allTags: 'All',
    noResult: 'No matching content found',
    copy: 'Copy',
    copied: 'Copied',
    toc: 'Contents',
    share: 'Share',
    relatedPosts: 'Related posts',
    theme: 'Theme',
    language: 'Language',
  },
  nav: {
    home: 'Home',
    blog: 'Blog',
    projects: 'Projects',
    about: 'About',
    contact: 'Contact',
    admin: 'Admin',
  },
  home: {
    greeting: "Hi, I'm",
    ctaBlog: 'Read the blog',
    ctaProjects: 'See my work',
    latestPosts: 'Latest posts',
    featuredProjects: 'Featured projects',
    skills: 'Tech stack',
    aboutTitle: 'About me',
    stats: {
      posts: 'posts',
      projects: 'projects',
      views: 'total views',
    },
  },
  blog: {
    title: 'Blog',
    subtitle: 'Notes on engineering, ideas and life',
    allPosts: 'All posts',
    taggedWith: 'Tagged: ',
    totalPosts: '{count} posts in total',
  },
  projects: {
    title: 'Projects',
    subtitle: 'Things I have built and explored',
    all: 'All',
    sourceCode: 'Source',
    liveDemo: 'Live demo',
    techStack: 'Tech stack',
    status: {
      active: 'Active',
      wip: 'In progress',
      archived: 'Archived',
    },
  },
  about: {
    title: 'About',
    subtitle: 'A person who loves building things',
    contactTitle: 'Get in touch',
    sendMessage: 'Send a message',
    name: 'Your name',
    email: 'Your email',
    message: 'Your message',
    submit: 'Submit',
    submitting: 'Submitting…',
    success: 'Message received. Thank you!',
    error: 'Failed to submit, please try again later',
    required: 'Please fill in all fields',
  },
  footer: {
    rights: 'All rights reserved',
    builtWith: 'Built with Next.js',
    quickLinks: 'Quick links',
    followMe: 'Follow me',
  },
  notFound: {
    title: 'Page not found',
    desc: 'The page you are looking for does not exist or has been removed',
    backHome: 'Back to home',
  },
};

export const dictionaries: Record<Locale, Dictionary> = { zh, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}
