export type Project = {
  title: string;
  description: string;
  githubUrl: string;
  tags: string[];
};

export type BlogPost = {
  title: string;
  excerpt: string;
  date: string;
  slug: string;
};