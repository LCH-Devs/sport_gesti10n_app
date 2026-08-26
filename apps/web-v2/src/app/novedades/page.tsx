'use client';

import React from 'react';
import { Header, Card, Badge, Button } from '@/components/common';
import { useTranslation } from '@/lib/useTranslation';

export default function NewsPage() {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = React.useState('allNews');
  const [search, setSearch] = React.useState('');

  const categoryKeyMap: Record<string, string> = {
    matches: 'matchResults',
    official: 'official',
    general: 'generalNews',
  };

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
    {
      title: t('news.article4Title'),
      date: t('news.article4Date'),
      category: 'official',
      categoryLabel: t('news.officialAnnouncements'),
      image: '📋',
      excerpt: t('news.article4Excerpt'),
    },
    {
      title: t('news.article5Title'),
      date: t('news.article5Date'),
      category: 'matchResults',
      categoryLabel: t('news.matchResults'),
      image: '🏆',
      excerpt: t('news.article5Excerpt'),
    },
    {
      title: t('news.article6Title'),
      date: t('news.article6Date'),
      category: 'generalNews',
      categoryLabel: t('news.generalNews'),
      image: '📈',
      excerpt: t('news.article6Excerpt'),
    },
    {
      title: t('news.article7Title'),
      date: t('news.article7Date'),
      category: 'official',
      categoryLabel: t('news.officialAnnouncements'),
      image: '⚠️',
      excerpt: t('news.article7Excerpt'),
    },
    {
      title: t('news.article8Title'),
      date: t('news.article8Date'),
      category: 'matchResults',
      categoryLabel: t('news.matchResults'),
      image: '🥅',
      excerpt: t('news.article8Excerpt'),
    },
    {
      title: t('news.article9Title'),
      date: t('news.article9Date'),
      category: 'generalNews',
      categoryLabel: t('news.generalNews'),
      image: '📱',
      excerpt: t('news.article9Excerpt'),
    },
    {
      title: t('news.article10Title'),
      date: t('news.article10Date'),
      category: 'official',
      categoryLabel: t('news.officialAnnouncements'),
      image: '📅',
      excerpt: t('news.article10Excerpt'),
    },
  ];

  const filteredArticles = articles.filter((article) => {
    const matchesCategory =
      activeCategory === 'allNews' || article.category === categoryKeyMap[activeCategory];
    const matchesSearch =
      search.trim() === '' ||
      article.title.toLowerCase().includes(search.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        title={t('news.title')}
        subtitle={t('news.subtitle')}
      >
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('news.searchPlaceholder')}
          className="px-4 py-2 rounded-md border border-slate-300 w-80"
        />
      </Header>

      <div className="p-6">
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
              variant={cat.key === activeCategory ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setActiveCategory(cat.key)}
            >
              {cat.label}
            </Button>
          ))}
        </div>

        {/* News Grid */}
        {filteredArticles.length === 0 ? (
          <p className="text-center text-slate-500 py-12">{t('messages.noData')}</p>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredArticles.map((article, index) => (
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
        )}

        {/* Load More */}
        <div className="text-center mt-8">
          <Button variant="secondary">{t('news.loadMore')}</Button>
        </div>
      </div>
    </div>
  );
}
