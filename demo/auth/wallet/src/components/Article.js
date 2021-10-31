export const Article = ({ children, title, onClick = () => {} }) => {
  return (
    <article>
      <header className="article-header">
        <h2>{title}</h2>
        <svg
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          onClick={onClick}
        >
          <path
            opacity="0.2"
            d="M14 24.5C19.799 24.5 24.5 19.799 24.5 14C24.5 8.20101 19.799 3.5 14 3.5C8.20101 3.5 3.5 8.20101 3.5 14C3.5 19.799 8.20101 24.5 14 24.5Z"
            fill="#8E8E93"
          />
          <path
            d="M14 24.5C19.799 24.5 24.5 19.799 24.5 14C24.5 8.20101 19.799 3.5 14 3.5C8.20101 3.5 3.5 8.20101 3.5 14C3.5 19.799 8.20101 24.5 14 24.5Z"
            stroke="#8E8E93"
            strokeWidth="1.5"
            strokeMiterlimit="10"
          />
          <path
            d="M9.625 14H18.375"
            stroke="#8E8E93"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14 9.625V18.375"
            stroke="#8E8E93"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </header>
      {children}
    </article>
  );
};
