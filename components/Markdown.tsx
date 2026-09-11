import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

/**
 * Markdown 渲染组件。
 * 正文由后台管理员撰写，因此允许内联 HTML（rehype-raw）以便插入视频、图表等。
 */
export function Markdown({ content, className = '' }: { content: string; className?: string }) {
  if (!content?.trim()) return null;

  return (
    <div className={`markdown ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeHighlight]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
