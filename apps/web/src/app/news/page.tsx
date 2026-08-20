'use client';

import React from 'react';
import { Header, Card, Badge, Button } from '@/components/common';

export default function NewsPage() {
  const articles = [
    {
      title: 'City United Secures Historic Victory In Final Minutes',
      date: '2 hours ago',
      category: 'MATCH RESULTS',
      image: '⚽',
      excerpt:
        'In a stunning display of resilience, City United overturned a two-goal deficit to clinch the regional title, marking their first championship win in over a...',
    },
    {
      title: 'Q3 Financial Reports Indicate Steady Growth Across Tier',
      date: 'Oct 23, 2024',
      category: 'GENERAL NEWS',
      image: '📊',
      excerpt:
        'Recent financial disclosures from the top 20 institutions reveal an average revenue increase of 4.2%, largely driven by broadcasting partnerships and...',
    },
    {
      title: 'New Analytics Platform Integration Rollout Scheduled',
      date: 'Oct 22, 2024',
      category: 'OFFICIAL ANNOUNCEMENTS',
      image: '📈',
      excerpt:
        'The highly anticipated transition to the new real-time player tracking and analytics platform will commence next week. All institutions are advised to review the...',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        title="Noticias y Novedades"
        subtitle="Sports news, announcements, and updates."
      >
        <input
          type="text"
          placeholder="Search news..."
          className="px-4 py-2 rounded-md border border-slate-300 w-80"
        />
      </Header>

      <div className="p-6">
        {/* Featured Article */}
        <Card className="mb-6 overflow-hidden">
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <div className="text-6xl mb-4">🏟️</div>
              <Badge label="OFFICIAL ANNOUNCEMENTS" variant="info" />
              <h2 className="text-3xl font-bold text-slate-900 mt-4 mb-2">
                AthlletiCorp Announces Major Restructuring of European Leagues
              </h2>
              <p className="text-slate-600 mb-4">
                In a sweeping move aimed at increasing competitive parity, the governing body has unveiled a comprehensive new framework that will affect all tier-one institutions starting next season.
              </p>
              <Button>Read Full Story</Button>
            </div>
            <div className="bg-slate-200 rounded-md flex items-center justify-center">
              [Featured Image]
            </div>
          </div>
        </Card>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-6">
          {['All News', 'Official Announcements', 'Match Results', 'General News'].map((cat) => (
            <Button
              key={cat}
              variant={cat === 'All News' ? 'primary' : 'secondary'}
              size="sm"
            >
              {cat}
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
              <Badge label={article.category} variant="info" />
              <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">
                {article.title}
              </h3>
              <p className="text-sm text-slate-600 mb-4 flex-grow">{article.excerpt}</p>
              <div>
                <p className="text-xs text-slate-500 mb-4">🕐 {article.date}</p>
                <Button variant="ghost" className="w-full">
                  Read Full Story
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-8">
          <Button variant="secondary">Load More News</Button>
        </div>
      </div>
    </div>
  );
}
