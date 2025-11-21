/**
 * Tests pour AIStatusBadge
 * =========================
 *
 * Tests du composant de badge d'état IA
 */

import { render, screen, waitFor } from '@testing-library/react';
import { AIStatusBadge } from '../../src/components/AIStatusBadge';
import { aiManager, AIProvider } from '../../src/utils/aiProviders';

// Mock de aiManager
jest.mock('../../src/utils/aiProviders', () => ({
  ...jest.requireActual('../../src/utils/aiProviders'),
  aiManager: {
    getAllConfigs: jest.fn()
  }
}));

// Mock de ollamaInstaller
jest.mock('../../src/services/ollamaInstaller', () => ({
  ollamaInstaller: {
    isInstalled: jest.fn()
  }
}));

describe('AIStatusBadge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should display "Mode démo" when no configs', async () => {
    (aiManager.getAllConfigs as jest.Mock).mockReturnValue([]);

    render(<AIStatusBadge />);

    await waitFor(() => {
      expect(screen.getByText(/Mode démo/i)).toBeInTheDocument();
    });
  });

  test('should display "Gemini" when Google provider is active', async () => {
    (aiManager.getAllConfigs as jest.Mock).mockReturnValue([
      {
        provider: AIProvider.GOOGLE,
        apiKey: 'test-key',
        model: 'gemini-2.5-flash',
        priority: 100,
        isActive: true
      }
    ]);

    render(<AIStatusBadge />);

    await waitFor(() => {
      expect(screen.getByText(/Gemini/i)).toBeInTheDocument();
    });
  });

  test('should display "Claude" when Anthropic provider is active', async () => {
    (aiManager.getAllConfigs as jest.Mock).mockReturnValue([
      {
        provider: AIProvider.ANTHROPIC,
        apiKey: 'test-key',
        model: 'claude-3-5-sonnet-20241022',
        priority: 100,
        isActive: true
      }
    ]);

    render(<AIStatusBadge />);

    await waitFor(() => {
      expect(screen.getByText(/Claude/i)).toBeInTheDocument();
    });
  });

  test('should display "OpenAI" when OpenAI provider is active', async () => {
    (aiManager.getAllConfigs as jest.Mock).mockReturnValue([
      {
        provider: AIProvider.OPENAI,
        apiKey: 'test-key',
        model: 'gpt-4o',
        priority: 100,
        isActive: true
      }
    ]);

    render(<AIStatusBadge />);

    await waitFor(() => {
      expect(screen.getByText(/OpenAI/i)).toBeInTheDocument();
    });
  });

  test('should display "Ollama" when local provider is active', async () => {
    (aiManager.getAllConfigs as jest.Mock).mockReturnValue([
      {
        provider: AIProvider.LOCAL,
        model: 'llama3.2:3b',
        endpoint: 'http://localhost:11434',
        priority: 50,
        isActive: true
      }
    ]);

    render(<AIStatusBadge />);

    await waitFor(() => {
      expect(screen.getByText(/Ollama/i)).toBeInTheDocument();
    });
  });

  test('should use highest priority provider when multiple active', async () => {
    (aiManager.getAllConfigs as jest.Mock).mockReturnValue([
      {
        provider: AIProvider.LOCAL,
        model: 'llama3.2:3b',
        priority: 25,
        isActive: true
      },
      {
        provider: AIProvider.GOOGLE,
        apiKey: 'test-key',
        model: 'gemini-2.5-flash',
        priority: 100,
        isActive: true
      },
      {
        provider: AIProvider.ANTHROPIC,
        apiKey: 'test-key',
        model: 'claude-3-5-sonnet-20241022',
        priority: 50,
        isActive: true
      }
    ]);

    render(<AIStatusBadge />);

    await waitFor(() => {
      // Should show Gemini (priority 100)
      expect(screen.getByText(/Gemini/i)).toBeInTheDocument();
    });
  });

  test('should ignore inactive providers', async () => {
    (aiManager.getAllConfigs as jest.Mock).mockReturnValue([
      {
        provider: AIProvider.GOOGLE,
        apiKey: 'test-key',
        model: 'gemini-2.5-flash',
        priority: 100,
        isActive: false // Inactive
      },
      {
        provider: AIProvider.ANTHROPIC,
        apiKey: 'test-key',
        model: 'claude-3-5-sonnet-20241022',
        priority: 50,
        isActive: true
      }
    ]);

    render(<AIStatusBadge />);

    await waitFor(() => {
      // Should show Claude (only active)
      expect(screen.getByText(/Claude/i)).toBeInTheDocument();
    });
  });

  test('should display "STATUT IA :" prefix', () => {
    (aiManager.getAllConfigs as jest.Mock).mockReturnValue([]);

    render(<AIStatusBadge />);

    expect(screen.getByText(/STATUT IA :/i)).toBeInTheDocument();
  });

  test('should render status dot', () => {
    (aiManager.getAllConfigs as jest.Mock).mockReturnValue([]);

    const { container } = render(<AIStatusBadge />);

    // Le dot est rendu comme un div avec borderRadius 50%
    const dot = container.querySelector('div > div[style*="border-radius: 50%"]');
    expect(dot).toBeInTheDocument();
  });
});
