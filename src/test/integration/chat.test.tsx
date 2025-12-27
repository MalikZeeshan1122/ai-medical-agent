import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, waitFor } from '@/test/utils';
import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { server } from '../mocks/server';
import { ChatInput } from '@/components/ChatInput';

describe('Chat Integration Tests', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('sends a message and receives a response', async () => {
    const handleSend = (message: string) => {
      expect(message).toBe('I have a headache');
    };

    const user = userEvent.setup();
    render(<ChatInput onSend={handleSend} />);

    const textarea = screen.getByPlaceholderText(/describe your symptoms/i);
    await user.type(textarea, 'I have a headache');
    
    const sendButton = screen.getByRole('button');
    await user.click(sendButton);

    await waitFor(() => {
      expect(textarea).toHaveValue('');
    });
  });

  it('disables input while sending message', async () => {
    const handleSend = () => {};
    const user = userEvent.setup();
    
    render(<ChatInput onSend={handleSend} disabled={true} />);

    const textarea = screen.getByPlaceholderText(/describe your symptoms/i);
    const sendButton = screen.getByRole('button');

    expect(textarea).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });

  it('clears input after sending', async () => {
    const messages: string[] = [];
    const handleSend = (message: string) => {
      messages.push(message);
    };

    const user = userEvent.setup();
    render(<ChatInput onSend={handleSend} />);

    const textarea = screen.getByPlaceholderText(/describe your symptoms/i);
    
    await user.type(textarea, 'First message');
    await user.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(textarea).toHaveValue('');
    });

    expect(messages).toContain('First message');
  });
});
