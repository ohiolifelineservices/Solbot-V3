# Solbot Web API Structure

## Core API Endpoints

### Authentication & User Management
```
POST   /api/auth/login              - User login
POST   /api/auth/register           - User registration  
POST   /api/auth/logout             - User logout
GET    /api/auth/me                 - Get current user
PUT    /api/auth/profile            - Update user profile
POST   /api/auth/wallet/connect     - Connect Solana wallet
```

### Subscription & Billing
```
GET    /api/subscription/tiers      - Get available tiers
POST   /api/subscription/upgrade    - Upgrade subscription
GET    /api/subscription/status     - Get current subscription
POST   /api/subscription/cancel     - Cancel subscription
GET    /api/billing/history         - Get billing history
POST   /api/billing/payment         - Process payment
```

### Trading Sessions
```
GET    /api/sessions                - List user sessions
POST   /api/sessions                - Create new session
GET    /api/sessions/:id            - Get session details
PUT    /api/sessions/:id            - Update session
DELETE /api/sessions/:id            - Delete session
POST   /api/sessions/:id/start      - Start trading
POST   /api/sessions/:id/pause      - Pause trading
POST   /api/sessions/:id/stop       - Stop trading
GET    /api/sessions/:id/metrics    - Get session metrics
GET    /api/sessions/:id/logs       - Get session logs
```

### Wallet Management
```
GET    /api/wallets                 - List user wallets
POST   /api/wallets                 - Create new wallet
GET    /api/wallets/:id             - Get wallet details
PUT    /api/wallets/:id             - Update wallet
DELETE /api/wallets/:id             - Delete wallet
GET    /api/wallets/:id/balance     - Get wallet balance
POST   /api/wallets/distribute      - Distribute SOL to wallets
POST   /api/wallets/collect         - Collect funds from wallets
```

### Token Management
```
GET    /api/tokens/search           - Search tokens
GET    /api/tokens/:address         - Get token details
GET    /api/tokens/:address/pools   - Get token pools
GET    /api/tokens/:address/metrics - Get token metrics
POST   /api/tokens/validate         - Validate token address
```

### Trading Configuration
```
GET    /api/config/strategies       - Get available strategies
GET    /api/config/default          - Get default configuration
PUT    /api/config/user             - Update user configuration
GET    /api/config/limits           - Get tier limits
```

### Metrics & Analytics
```
GET    /api/metrics/dashboard       - Dashboard metrics
GET    /api/metrics/volume          - Volume analytics
GET    /api/metrics/performance     - Performance analytics
GET    /api/metrics/fees            - Fee analytics
GET    /api/metrics/export          - Export metrics data
```

### Real-time WebSocket Events
```
WS     /ws/sessions/:id             - Session updates
WS     /ws/metrics                  - Real-time metrics
WS     /ws/notifications            - User notifications
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  subscription_tier VARCHAR(50) DEFAULT 'free',
  wallet_address VARCHAR(44),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);
```

### Trading Sessions Table
```sql
CREATE TABLE trading_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  token_address VARCHAR(44) NOT NULL,
  token_name VARCHAR(100),
  token_symbol VARCHAR(20),
  strategy VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'created',
  config JSONB NOT NULL,
  pool_keys JSONB,
  admin_wallet_address VARCHAR(44),
  admin_wallet_private_key_encrypted TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  ended_at TIMESTAMP
);
```

### Trading Wallets Table
```sql
CREATE TABLE trading_wallets (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES trading_sessions(id),
  wallet_number INTEGER NOT NULL,
  public_key VARCHAR(44) NOT NULL,
  private_key_encrypted TEXT NOT NULL,
  sol_balance DECIMAL(18,9) DEFAULT 0,
  token_balance DECIMAL(18,9) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Transactions Table
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES trading_sessions(id),
  wallet_id UUID REFERENCES trading_wallets(id),
  transaction_hash VARCHAR(88) NOT NULL,
  type VARCHAR(10) NOT NULL, -- 'buy' or 'sell'
  amount_sol DECIMAL(18,9) NOT NULL,
  amount_token DECIMAL(18,9) NOT NULL,
  price_usd DECIMAL(18,6),
  slippage DECIMAL(5,2),
  fees_sol DECIMAL(18,9),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP
);
```

### Fee Transactions Table
```sql
CREATE TABLE fee_transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  session_id UUID REFERENCES trading_sessions(id),
  transaction_hash VARCHAR(88),
  volume_usd DECIMAL(18,6) NOT NULL,
  fee_sol DECIMAL(18,9) NOT NULL,
  fee_usd DECIMAL(18,6) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Metrics Table
```sql
CREATE TABLE session_metrics (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES trading_sessions(id),
  timestamp TIMESTAMP NOT NULL,
  total_volume_usd DECIMAL(18,6),
  total_volume_sol DECIMAL(18,9),
  transaction_count INTEGER,
  success_rate DECIMAL(5,2),
  average_slippage DECIMAL(5,2),
  active_wallets INTEGER,
  total_fees_paid DECIMAL(18,9),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Frontend Components Structure

### Dashboard Components
```
/components
  /dashboard
    - DashboardOverview.tsx
    - VolumeChart.tsx
    - PerformanceMetrics.tsx
    - ActiveSessions.tsx
    - RecentTransactions.tsx
    - WalletBalances.tsx
```

### Session Management
```
/components
  /sessions
    - SessionList.tsx
    - SessionCard.tsx
    - CreateSession.tsx
    - SessionDetails.tsx
    - SessionControls.tsx
    - SessionMetrics.tsx
    - SessionLogs.tsx
```

### Trading Configuration
```
/components
  /trading
    - StrategySelector.tsx
    - TradingParameters.tsx
    - WalletConfiguration.tsx
    - RiskSettings.tsx
    - AdvancedSettings.tsx
```

### Wallet Management
```
/components
  /wallets
    - WalletList.tsx
    - WalletCard.tsx
    - CreateWallet.tsx
    - WalletBalance.tsx
    - FundDistribution.tsx
    - WalletSecurity.tsx
```

## State Management (Zustand)

### Auth Store
```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  subscription: Subscription | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  updateProfile: (data: ProfileData) => Promise<void>;
}
```

### Trading Store
```typescript
interface TradingState {
  sessions: TradingSession[];
  activeSession: TradingSession | null;
  metrics: TradingMetrics | null;
  createSession: (config: SessionConfig) => Promise<void>;
  startSession: (sessionId: string) => Promise<void>;
  pauseSession: (sessionId: string) => Promise<void>;
  stopSession: (sessionId: string) => Promise<void>;
  updateMetrics: (sessionId: string, metrics: TradingMetrics) => void;
}
```

### Wallet Store
```typescript
interface WalletState {
  wallets: TradingWallet[];
  balances: Record<string, WalletBalance>;
  createWallet: () => Promise<TradingWallet>;
  distributeFunds: (amount: number, wallets: string[]) => Promise<void>;
  collectFunds: (wallets: string[]) => Promise<void>;
  updateBalance: (walletId: string, balance: WalletBalance) => void;
}
```

## Real-time Updates

### WebSocket Implementation
```typescript
class WebSocketManager {
  private connections: Map<string, WebSocket> = new Map();
  
  connect(sessionId: string): void;
  disconnect(sessionId: string): void;
  sendUpdate(sessionId: string, data: any): void;
  onMessage(sessionId: string, callback: (data: any) => void): void;
}
```

### Event Types
```typescript
type WebSocketEvent = 
  | { type: 'TRANSACTION_COMPLETED'; data: Transaction }
  | { type: 'METRICS_UPDATE'; data: TradingMetrics }
  | { type: 'SESSION_STATUS_CHANGED'; data: { status: string } }
  | { type: 'WALLET_BALANCE_UPDATED'; data: WalletBalance }
  | { type: 'ERROR_OCCURRED'; data: { error: string } };
```