import type { JSX } from 'react';
import { GameScreen } from './components/GameScreen';

export function App(): JSX.Element {
  return (
    <div className="app">
      <GameScreen />
    </div>
  );
}

export default App;
