import React from 'react';

const Message = ({ message }) => {
  const { role, content, model } = message;
  const isAssistant = role === 'assistant';

  return (
    <div className={`message ${isAssistant ? 'assistant' : 'user'}`}>
      <div className="message-content">{content}</div>
      {isAssistant && model && (
        <div className="message-model-badge">{model}</div>
      )}
    </div>
  );
};

export default Message;
