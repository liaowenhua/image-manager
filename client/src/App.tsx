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
    <div className="min-h-screen bg-gray-50">
      <Header onSearch={handleSearch} onScan={handleScan} scanning={scanning} />
      <TabBar activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); setPage(1); setSelectedMonth(null); }} />

      <Container>
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : (
          <>
            {activeTab === 'all' && (
              <>
                {selectedMonth && (
                  <div className="mb-4 p-2 bg-indigo-50 rounded text-sm text-indigo-700">
                    筛选: {selectedMonth}
                    <button onClick={() => setSelectedMonth(null)} className="ml-2 underline">
                      清除
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
        onClose={() => setSelectedPhoto(null)}
        onFavorite={handleFavorite}
        onRating={handleRating}
      />
    </div>
  );
}

export default App;