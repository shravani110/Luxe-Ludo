import React from 'react';
import { Provider } from 'react-redux';
import { store } from './state/store';
import { Game } from './components/Game/Game';

export const App: React.FC = () => {
  return (
    <Provider store={store}>
      <Game />
    </Provider>
  );
};

export default App;
