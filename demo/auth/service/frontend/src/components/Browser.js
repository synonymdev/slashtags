export const Browser = ({ children }) => {
  return (
    <div className="browser">
      <div className="browser-header">
        <div
          className="browser-button"
          style={{ backgroundColor: '#E96E4C' }}
        />
        <div
          className="browser-button"
          style={{ backgroundColor: '#E6A935' }}
        />
        <div
          className="browser-button"
          style={{ backgroundColor: '#85C33D' }}
        />
      </div>
      <div className="browser-container">{children}</div>
    </div>
  );
};
