"use client";

import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";

interface Props {
  source: MDXRemoteSerializeResult;
}

export function ArticleBody({ source }: Props) {
  return (
    <div className="article-body">
      <MDXRemote {...source} />
    </div>
  );
}
