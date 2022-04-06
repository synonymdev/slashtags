import * as jdenticon from 'jdenticon';
import { useRef, useContext, useEffect, useState } from 'react';

export const Jdenticon = ({ className, value = 'test', size = '100%' }) => {
  const icon = useRef(null);

  useEffect(() => {
    jdenticon.update(icon.current, value);
  }, [value]);

  return (
    <div className={className}>
      <svg data-jdenticon-value={value} height={size} ref={icon} width={size} />
    </div>
  );
};
