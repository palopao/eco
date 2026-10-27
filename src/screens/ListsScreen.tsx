import type { Album, UserList } from "../types";
import { AppHeader } from "../components/ui/AppHeader";
import { Icon } from "../components/ui/Icon";

export function ListsScreen({ lists, albums, createList, openShare }: { lists: UserList[]; albums: Album[]; createList: () => void; openShare: () => void }) {
  return <>    <AppHeader onHome={() => {}} title="Lists" action={<button className="header-icon-button" onClick={createList} aria-label="Create list"><Icon name="plus" /></button>} /><main className="list-viewer">
    {lists.map((list) => {
      const sortedAlbums = (list.albums ?? []).slice().sort((a: { position: number }, b: { position: number }) => a.position - b.position);
      const ids = list.albumIds ?? sortedAlbums.map((item: { albumId: string }) => item.albumId) ?? [];
      const items = ids.map((id: string) => albums.find((album) => album.id === id)).filter((album): album is Album => Boolean(album));
      const duration = items.reduce((total: number, album: Album) => total + (Number.parseInt(album.duration, 10) || 0), 0);
      const rating = items.length ? items.reduce((total: number, album: Album) => total + album.averageRating, 0) / items.length : 0;
      return <section className="community-card" key={list.id}>
        <div className="cover-collage">{items.slice(0, 3).map((album: Album) => <img key={album.id} src={album.coverUrl} alt="" />)}</div>
        <span>CURATED LIST</span><h2>{list.title}</h2><p>{list.description}</p>
        <div className="aggregate-stats"><span><b>{items.length}</b> Albums</span><span><b>{duration} min</b> Total</span><span><b>{rating.toFixed(1)}</b> Avg rating</span></div>
        <div className="numbered-grid">{items.map((album: Album, index: number) => <article key={album.id}><div><img src={album.coverUrl} alt={album.title} /><span>{String(index + 1).padStart(2, "0")}</span></div><strong>{album.title}</strong><small>{album.artist}</small></article>)}</div>
        <button className="icon-button" onClick={openShare} aria-label={`Share ${list.title}`}><Icon name="share" size={19} /></button>
      </section>;
    })}
    {lists.length === 0 && <div className="screen-heading"><span>DISCOVER & CURATE</span><h1>Your lists</h1><p>Public community lists and your own collections will appear here.</p></div>}
    <div className="list-footer-actions"><button className="new-list" onClick={createList}><Icon name="plus" size={17} /> New list</button></div>
  </main></>;
}
