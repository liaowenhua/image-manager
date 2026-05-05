import { useState, useEffect } from 'react';
import type { Photo, Album, Tag, TimelineItem } from './types';
import { Header } from './components/Layout/Header';
import { TabBar } from './components/Layout/TabBar';
import { Container } from './components/Layout/Container';
import { PhotoGrid } from './components/Photo/PhotoGrid';
import { PhotoViewer } from './components/Photo/PhotoViewer';
import { AlbumList } from './components/Album/AlbumList';
import { TagList } from './components/Tag/TagList';
import { TimelineView } from './components/Timeline/TimelineView';
import { Pagination } from './components/Common/Pagination';
import * as api from './api/client';

function App() {
  const [activeTab, setActiveTab] = useState('all');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab, page, selectedMonth]);

  // Update selected photo when favorite/rating changes
  useEffect(() => {
    if (selectedPhoto) {
      const updated = photos.find(p => p.id === selectedPhoto.id);
      if (updated) {
        setSelectedPhoto(updated);
      }
    }
  }, [photos]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'all') {
        const filters = selectedMonth ? { date: selectedMonth } : undefined;
        const res = await api.getPhotos(page, 20, filters);
        setPhotos(res.data.data);
        setTotalPages(res.data.pagination.totalPages);
      } else if (activeTab === 'albums') {
        const res = await api.getAlbums();
        setAlbums(res.data);
      } else if (activeTab === 'tags') {
        const res = await api.getTags();
        setTags(res.data);
      } else if (activeTab === 'favorites') {
        const res = await api.getFavorites(page);
        setPhotos(res.data.data);
        setTotalPages(res.data.pagination.totalPages);
      } else if (activeTab === 'timeline') {
        const res = await api.getTimeline();
        setTimeline(res.data);
      }
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setSelectedMonth(null);
    if (query) {
      setLoading(true);
      try {
        const res = await api.searchPhotos({ q: query, page });
        setPhotos(res.data.data);
        setTotalPages(res.data.pagination.totalPages);
        setActiveTab('all');
      } catch (e) {
        console.error('Search error:', e);
      } finally {
        setLoading(false);
      }
    } else {
      loadData();
    }
  };

  const handleFavorite = async (id: number, favorite: boolean) => {
    await api.setFavorite(id, favorite);
    setPhotos(photos.map(p => p.id === id ? { ...p, favorite } : p));
    if (selectedPhoto?.id === id) {
      setSelectedPhoto({ ...selectedPhoto, favorite });
    }
  };

  const handleRating = async (id: number, rating: number) => {
    await api.setRating(id, rating);
    setPhotos(photos.map(p => p.id === id ? { ...p, rating } : p));
    if (selectedPhoto?.id === id) {
      setSelectedPhoto({ ...selectedPhoto, rating });
    }
  };

  const handleScan = async () => {
    const path = prompt('Enter the folder path to scan:');
    if (!path) return;

    setScanning(true);
    try {
      const result = await api.scanPhotos(path);
      alert(`Scan complete: ${result.data.added} added, ${result.data.updated} updated, ${result.data.skipped} skipped`);
      loadData();
    } catch (e: any) {
      alert(`Scan failed: ${e.message}`);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <Header onSearch={handleSearch} onScan={handleScan} scanning={scanning} />
      <TabBar activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); setPage(1); setSelectedMonth(null); }} />

      <Container>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="mt-4 text-gray-500 font-medium">加载中...</p>
          </div>
        ) : (
          <>
            {activeTab === 'all' && (
              <>
                {selectedMonth && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200/50 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                      </div>
                      <span className="text-indigo-700 font-medium">筛选: {selectedMonth}</span>
                    </div>
                    <button
                      onClick={() => setSelectedMonth(null)}
                      className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition-colors"
                    >
                      清除筛选
                    </button>
                  </div>
                )}
                <PhotoGrid
                  photos={photos}
                  onPhotoSelect={setSelectedPhoto}
                  onFavorite={handleFavorite}
                  onRating={handleRating}
                />
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </>
            )}

            {activeTab === 'albums' && (
              <AlbumList albums={albums} onAlbumSelect={(album) => console.log('Select album:', album)} />
            )}

            {activeTab === 'tags' && (
              <TagList tags={tags} onTagSelect={(tag) => console.log('Select tag:', tag)} />
            )}

            {activeTab === 'favorites' && (
              <>
                <PhotoGrid photos={photos} onPhotoSelect={setSelectedPhoto} onFavorite={handleFavorite} onRating={handleRating} />
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </>
            )}

            {activeTab === 'timeline' && (
              <TimelineView timeline={timeline} onMonthSelect={(month) => { setSelectedMonth(month); setActiveTab('all'); setPage(1); }} />
            )}
          </>
        )}
      </Container>

      <PhotoViewer
        photo={selectedPhoto}
        photos={photos}
        onClose={() => setSelectedPhoto(null)}
        onFavorite={handleFavorite}
        onRating={handleRating}
      />
    </div>
  );
}

export default App;