// src/components/Message.jsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Message = ({ message }) => {
  const { role, content, modelLabel, model } = message;
  const isAssistant = role === 'assistant';

  return (
    <div className={`message ${isAssistant ? 'assistant' : 'user'}`}>
      <div className="message-content">
        {isAssistant ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content || ''}
          </ReactMarkdown>
        ) : (
          <div>{content}</div>
        )}
      </div>

      {isAssistant && (modelLabel || model) && (
        <div className="message-model-badge">
          {modelLabel || model}
        </div>
      )}
    </div>
  );
};

export default Message;
