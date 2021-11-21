import { Phone } from './Phone';
import background from './Wallpaper.jpg';
import { useReducer } from 'react';
import { initialValue, reducer, StoreContext } from '../store';

export const App = () => {
  const [store, dispatch] = useReducer(reducer, initialValue);

  return (
    <div className="App" style={{ backgroundImage: `url(${background})` }}>
      <StoreContext.Provider value={{ store, dispatch }}>
        <Phone />
      </StoreContext.Provider>
    </div>
  );
};
