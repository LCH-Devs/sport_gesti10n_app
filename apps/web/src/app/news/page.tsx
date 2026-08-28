'use client';

import React from 'react';
import { Header, Card, Badge, Button } from '@/components/common';
import { useTranslation } from '@/lib/useTranslation';

export default function NewsPage() {
  const { t } = useTranslation();
  const articles = [
    {
      title: t('news.article1Title'),
      date: t('news.article1Date'),
      category: 'matchResults',
      categoryLabel: t('news.matchResults'),
      image: '⚽',
      excerpt: t('news.article1Excerpt'),
    },
    {
      title: t('news.article2Title'),
      date: 'Oct 23, 2024',
      category: 'generalNews',
      categoryLabel: t('news.generalNews'),
      image: '📊',
      excerpt: t('news.article2Excerpt'),
    },
    {
      title: t('news.article3Title'),
      date: 'Oct 22, 2024',
      category: 'official',
      categoryLabel: t('news.officialAnnouncements'),
      image: '📈',
      excerpt: t('news.article3Excerpt'),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        title={t('news.title')}
        subtitle={t('news.subtitle')}
      >
        <input
          type="text"
          placeholder={t('news.searchPlaceholder')}
          className="px-4 py-2 rounded-md border border-slate-300 w-80"
        />
      </Header>

      <div className="p-6">
        {/* Featured Article */}
        <Card className="mb-6 overflow-hidden">
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <div className="text-6xl mb-4">🏟️</div>
              <Badge label={t('news.officialAnnouncements')} variant="info" />
              <h2 className="text-3xl font-bold text-slate-900 mt-4 mb-2">
                {t('news.featuredTitle')}
              </h2>
              <p className="text-slate-600 mb-4">
                {t('news.featuredDescription')}
              </p>
              <Button>{t('news.readFullStory')}</Button>
            </div>
            <div className="bg-slate-200 rounded-md flex items-center justify-center">
              [{t('news.featuredImage')}]
            </div>
          </div>
        </Card>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'allNews', label: t('news.allNews') },
            { key: 'official', label: t('news.officialAnnouncements') },
            { key: 'matches', label: t('news.matchResults') },
            { key: 'general', label: t('news.generalNews') },
          ].map((cat) => (
            <Button
              key={cat.key}
              variant={cat.key === 'allNews' ? 'primary' : 'secondary'}
              size="sm"
            >
              {cat.label}
            </Button>
          ))}
        </div>

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {articles.map((article, index) => (
            <Card key={index} className="flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="text-4xl">{article.image}</div>
              </div>
              <Badge label={article.categoryLabel} variant="info" />
              <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">
                {article.title}
              </h3>
              <p className="text-sm text-slate-600 mb-4 flex-grow">{article.excerpt}</p>
              <div>
                <p className="text-xs text-slate-500 mb-4">🕐 {article.date}</p>
                <Button variant="ghost" className="w-full">
                  {t('news.readFullStory')}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-8">
          <Button variant="secondary">{t('news.loadMore')}</Button>
        </div>
      </div>
    </div>
  );
}

