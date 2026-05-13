import React, { useEffect, useMemo, useState } from 'react';

const ProductImage = ({
  imageSources = [],
  alt,
  containerClassName = '',
  imgClassName = '',
  fallbackClassName = '',
  fallbackContent = null,
  loading = 'lazy',
}) => {
  const sources = useMemo(
    () => [...new Set((imageSources || []).filter(Boolean))],
    [imageSources]
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
  }, [sources.join('|')]);

  const activeSource = sources[currentIndex];

  return (
    <div className={containerClassName}>
      {activeSource ? (
        <img
          src={activeSource}
          alt={alt}
          loading={loading}
          className={imgClassName}
          onError={() => {
            setCurrentIndex((prev) => prev + 1);
          }}
        />
      ) : (
        <div className={fallbackClassName}>{fallbackContent}</div>
      )}
    </div>
  );
};

export default ProductImage;
