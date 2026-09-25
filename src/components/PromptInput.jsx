import { useState } from 'react';

const PLACEHOLDER =
  '5 days in Lisbon in October, budget-friendly, love food markets and old neighborhoods, one day trip to Sintra, no early mornings...';

export default function PromptInput({ onSubmit, disabled }) {
  const [text, setText] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSubmit(text.trim());
  }

  return (
    <form className="prompt-input" onSubmit={handleSubmit}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={PLACEHOLDER}
        rows={4}
        disabled={disabled}
      />
      <button type="submit" disabled={disabled || !text.trim()}>
        {disabled ? 'Planning…' : 'Plan my trip'}
      </button>
    </form>
  );
}
