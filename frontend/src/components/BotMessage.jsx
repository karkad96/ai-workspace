import { Component } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import styles from './BotMessage.module.css';

class ErrorBoundary extends Component {
  state = { crashed: false };
  static getDerivedStateFromError() { return { crashed: true }; }
  render() {
    if (this.state.crashed) return <span className={styles.fallback}>{this.props.content}</span>;
    return this.props.children;
  }
}

export default function BotMessage({ content }) {
  return (
    <ErrorBoundary content={content}>
      <div className={styles.body}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex, [rehypeHighlight, { detect: true }]]}
        >
          {content}
        </ReactMarkdown>
      </div>
    </ErrorBoundary>
  );
}
