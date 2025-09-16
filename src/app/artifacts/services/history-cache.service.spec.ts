import { HistoryCacheService } from './history-cache.service';
import { ArtifactHistoryItem } from '../../models/artifact-history.model';
declare const expect: any;

describe('HistoryCacheService', () => {
  let service: HistoryCacheService;

  const makeItem = (txId: string): ArtifactHistoryItem => ({
    txId,
    timestamp: new Date().toISOString(),
    isDelete: false,
  } as any);

  beforeEach(() => {
    service = new HistoryCacheService();
  });

  it('returns undefined for missing keys', () => {
    expect(service.get('missing')).toBeUndefined();
  });

  it('stores and retrieves items; get() promotes recency', () => {
    (service as any).maxEntries = 2; // shrink for test
    service.set('a', makeItem('a'));
    service.set('b', makeItem('b'));
    // Access "a" to promote it
    expect(service.get('a')?.txId).toBe('a');
    // Add another -> should evict "b" (oldest)
    service.set('c', makeItem('c'));
    expect(service.get('b')).toBeUndefined();
    expect(service.get('a')?.txId).toBe('a');
    expect(service.get('c')?.txId).toBe('c');
  });

  it('evicts the oldest entry when capacity exceeded', () => {
    (service as any).maxEntries = 2;
    service.set('a', makeItem('a'));
    service.set('b', makeItem('b'));
    service.set('c', makeItem('c'));
    expect(service.get('a')).toBeUndefined();
    expect(service.get('b')?.txId).toBe('b');
    expect(service.get('c')?.txId).toBe('c');
  });

  it('clear() empties the cache', () => {
    service.set('x', makeItem('x'));
    service.set('y', makeItem('y'));
    service.clear();
    expect(service.get('x')).toBeUndefined();
    expect(service.get('y')).toBeUndefined();
  });
});


