import { useContext } from 'react';
import { StoreContext, types } from '../strore';
import { Alert } from '../components/Alert';

export const Error = () => {
  const { store, dispatch } = useContext(StoreContext);

  const error = store.prompt?.error;

  return (
    <Alert isVisible={error}>
      <div className="error">
        <p>{error}</p>

        <button
          className="btn primary"
          onClick={() => dispatch({ type: types.SET_PROMPT, prompt: null })}
        >
          OK
        </button>
      </div>
    </Alert>
  );
};
