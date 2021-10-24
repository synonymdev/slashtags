import background from './Wallpaper.jpg';
import { useReducer } from 'react';
import { initialValue, reducer, StoreContext } from '../strore';
import { Website } from './Website';

export const App = () => {
  const [store, dispatch] = useReducer(reducer, initialValue);

  return (
    <div className="App" style={{ backgroundImage: `url(${background})` }}>
      <StoreContext.Provider value={{ store, dispatch }}>
        <Website />
      </StoreContext.Provider>
    </div>
  );
};
