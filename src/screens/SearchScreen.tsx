import { useState } from "react";
import type { Album } from "../types";
import { AppHeader } from "../components/ui/AppHeader";
import { Icon } from "../components/ui/Icon";
import { SectionTitle } from "../components/ui/SectionTitle";
import { ActiveFilters } from "../components/ui/ActiveFilters";
import { SearchGuide } from "../components/ui/SearchGuide";
import { SearchLoading } from "../components/ui/SearchLoading";
import { useSearch, type SearchCategory } from "../hooks/useSearch";
import { FilterSheet } from "./Search/FilterSheet";

export function SearchScreen({ albums, openAlbum, openArtist }: { albums: Album[]; openAlbum: (id?: string) => void; openArtist: (artist: string) => void }) {
  const {
    category,
    setCategory,
    filters,
    toggleFilter,
    removeFilter,
    searchText,
    setSearchText,
    normalizedSearch,
    hasFullSearch,
    hasActiveFilters,
    searching,
    searchError,
    searchAlbums,
    searchTracks,
    baseAlbums,
    artists,
    filteredAlbums,
    hasSearched,
    executeSearch,
    loadMore,
    hasMoreResults,
  } = useSearch({ initialAlbums: albums });

  const [filterOpen, setFilterOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [catalogueCollapsed, setCatalogueCollapsed] = useState(false);

  return (
    <>
      <AppHeader onHome={() => setGuideOpen(true)} title="Search" action={<button type="button" className="header-icon-button" onClick={() => setGuideOpen(true)} aria-label="Search guide"><Icon name="search" size={19} /> Guide</button>} />
      <main className="search-page">
        <div className="search-header">
          <div className="global-search">
            <Icon name="search" size={20} />
            <input
              autoFocus
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  executeSearch();
                }
              }}
              placeholder="Search albums, artists, tracks..."
            />
            <button type="button" onClick={executeSearch} aria-label="Search"><Icon name="search" size={17} /></button>
          </div>
          <div className="category-tabs">
            {["All", "Albums", "Artists", "Tracks", "Users", "Lists"].map((item) => (
              <button className={category === item ? "active" : ""} onClick={() => setCategory(item as SearchCategory)} key={item}>
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="active-filters-bar">
          <ActiveFilters filters={filters} onRemove={removeFilter} />
          <button type="button" className="filter-tune" onClick={() => setFilterOpen(true)}><Icon name="filter" size={16} /></button>
        </div>

        {searchError && <p role="alert" className="error-text">{searchError}</p>}

        {category === "All" && !hasFullSearch && !hasActiveFilters && (
          <section className="release-calendar collapsible-section">
            <button type="button" className="collapsible-header" onClick={() => setCatalogueCollapsed((prev) => !prev)}>
              <SectionTitle>Recent catalogue</SectionTitle>
              <span style={{ transform: catalogueCollapsed ? "rotate(-90deg)" : "rotate(0)" }}><Icon name="chevron" size={15} /></span>
            </button>
            {!catalogueCollapsed && (
              <div className="collapsible-content">
                <div className="release-timeline">
                  {[...albums]
                    .sort((left, right) => right.year - left.year)
                    .slice(0, 4)
                    .map((album) => (
                      <button key={album.id} onClick={() => openAlbum(album.id)}>
                        <div>
                          <img src={album.coverUrl} alt="" />
                          <span>{album.year}</span>
                        </div>
                        <strong>{album.title}</strong>
                        <small>{album.artist}</small>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </section>
        )}

        {(category === "All" || category === "Albums") && (
          <section className="result-section">
            <SectionTitle>Albums</SectionTitle>
            <div className="search-albums">
              {filteredAlbums.map((album) => (
                <button key={album.id} onClick={() => openAlbum(album.id)}>
                  <img src={album.coverUrl} alt="" />
                  <strong>{album.title}</strong>
                  <span>{album.artist}</span>
                </button>
              ))}
            </div>
            {searching && <SearchLoading message="Searching albums…" />}
            {!searching && hasFullSearch && filteredAlbums.length === 0 && <p className="screen-heading">No matching albums found.</p>}
            {!searching && hasMoreResults && <button className="publish-button" onClick={loadMore}>Load More</button>}
          </section>
        )}

        {(category === "All" || category === "Artists") && (
          <section className="result-section">
            <SectionTitle>Artists</SectionTitle>
            <div className="artist-results">
              {artists.map((album) => (
                <button key={album.artist} onClick={() => openArtist(album.artist)}>
                  <img src={album.coverUrl} alt="" />
                  <div>
                    <strong>{album.artist}</strong>
                    <span>Artist</span>
                  </div>
                  <Icon name="chevron" size={17} />
                </button>
              ))}
            </div>
          </section>
        )}

        {(category === "All" || category === "Tracks") && (
          <section className="result-section tracks-results">
            <SectionTitle>Tracks</SectionTitle>
            {category === "Tracks" && hasFullSearch ? (
              <div className="track-search-results">
                {searchTracks.map((track) => (
                  <button key={track.id} onClick={() => openAlbum(track.albumId)}>
                    <span className="track-search-play"><Icon name="plus" size={17} /></span>
                    <span>
                      <strong>{track.title}</strong>
                      <small>{track.artist} · {track.albumTitle} · {track.year || "Year unknown"}</small>
                    </span>
                  </button>
                ))}
                {searching && <SearchLoading message="Searching tracks…" />}
                {!searching && searchTracks.length === 0 && !searchError && <p className="screen-heading">No matching tracks found.</p>}
              </div>
            ) : (
              <p className="screen-heading">
                {category === "All" ? "Choose Tracks to search song titles." : "Type at least two characters to search tracks."}
              </p>
            )}
          </section>
        )}

        {(category === "All" || category === "Users") && (
          <section className="result-section user-results">
            <SectionTitle>Users</SectionTitle>
            <p className="screen-heading">Member search is not available yet.</p>
          </section>
        )}

        {(category === "All" || category === "Lists") && (
          <section className="result-section search-list-results">
            <SectionTitle>Lists</SectionTitle>
            <p className="screen-heading">Explore public lists from the Lists tab.</p>
          </section>
        )}
      </main>
      {filterOpen && <FilterSheet close={() => setFilterOpen(false)} filters={filters} onApply={toggleFilter} />}
      {guideOpen && <SearchGuide onClose={() => setGuideOpen(false)} />}
    </>
  );
}
