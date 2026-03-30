import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  robots?: string;
}

export const SEO: React.FC<SEOProps> = ({
  title = 'AI Validator - Проверка документов с искусственным интеллектом',
  description = 'Сервис для проверки документов с использованием AI. Анализ структуры, содержания и соответствия требованиям.',
  image = '/og-image.png',
  url = window.location.href,
  type = 'website',
  robots = 'index, follow',
}) => {
  const siteTitle = 'AI Validator';
  const fullTitle = title.includes(siteTitle) ? title : `${title} | ${siteTitle}`;

  return (
    <Helmet>
        <title>{fullTitle}</title>
        <meta name="description" content={description} />
    
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={image} />
        <meta property="og:url" content={url} />
        <meta property="og:type" content={type} />
        <meta property="og:site_name" content={siteTitle} />

        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#7e57c2" />
        <link rel="canonical" href={url} />

        <meta name="robots" content={robots} />

        <script type="application/ld+json">
            {JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": "AI Validator",
                "description": description,
                "url": url
            })}
        </script>
    </Helmet>
  );
};