# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PageLink-client is a Vue 3 + TypeScript frontend application built with Vite. It's a bookmark management system that allows users to organize and search through collections of documents.

This client communicates with 2 MSA Servers:

- pagelink-service-server: Control APIs involved in using user information and features
- pagelink-retrieve-server: Processing for document recommendations

Codes in this project are maintained/edited in `*.pseudoCode.txt` domain, which includes roles and algorithms of the module.  
`*.pseudoCode.txt` should be:

- Compatible to any popular framework
- Core and abstractive form for human-readability
- Specify properties exchanged with other modules

## Architecture

```
src
├── App.pseudoCode.txt
├── App.vue
├── TestAppHeader-test.vue
├── TestToolBar-test.vue
├── components
│   ├── app-header
│   │   ├── AppHeader.pseudocode.txt
│   │   ├── AppHeader.vue
│   │   ├── ToolBar.pseudoCode.txt
│   │   └── ToolBar.vue
│   ├── assets
│   │   └── logo.svg
│   ├── bookmark-page
│   │   ├── BookmarkPage.vue
│   │   ├── DEPENDENCY_ANALYSIS.md
│   │   ├── bottom-sheet
│   │   │   ├── BottomSheet.pseudoCode.txt
│   │   │   ├── BottomSheet.vue
│   │   │   ├── CommentBox.pseudoCode.txt
│   │   │   └── CommentBox.vue
│   │   └── collections
│   │       ├── CollectionItem.pseudoCode-v2.txt
│   │       ├── CollectionItem.pseudoCode.txt
│   │       ├── CollectionItem.vue
│   │       ├── Collections.pseudoCode.txt
│   │       └── Collections.vue
│   └── explore-page
│       └── ExplorePage.vue
├── i18n.ts
├── locales
│   ├── en.json
│   ├── ja.json
│   └── ko.json
├── main.ts
├── stores
│   ├── DataComponents-memo.txt
│   ├── DataComponents.pseudoCode.txt
│   └── DataComponents.ts
└── styles
    └── color_template.css
```

### Component Hierarchy

```
App.vue (Root)
├── AppHeader
│   ├── Logo, Account, Settings buttons
│   └── ToolBar (search/add functionality)
├── BookmarkPage (currentMode === 'bookmark')
│   ├── Collections (container)
│   │   └── CollectionItem (presenter)
│   └── BottomSheet (TODO: link details/editing)
└── ExplorePage (currentMode === 'explore')
```

### State Management (Pinia)

The application uses a single Pinia store (`useFileSystemStore` in `src/stores/DataComponents.ts`) that implements a composite pattern:

- **Collection**: Container for documents/items (1 level deep only - no nested collections)
- **Document**: Leaf node representing a bookmark with tags
- **LeafNode**: Abstract class for all leaf types

Key store features:

- Search functionality with visibility filtering (`updateVisible()` method)
- Collection and item CRUD operations
- Selection state management (selected collection/item)
- Sample data generation for development

### Display Mode System

The app switches between two modes managed in `App.vue`:

- **bookmark**: Shows BookmarkPage with Collections
- **explore**: Shows ExplorePage (future feature)

Mode changes are triggered by AppHeader and flow through the `displayModeChange` event.

### Internationalization (i18n)

- Uses `vue-i18n` with legacy mode disabled
- Default locale: Korean (`ko`)
- Fallback locale: English (`en`)
- Locale files: `src/locales/*.json` (ko, en, ja available)

### Styling

- Global CSS variables in `src/styles/color_template.css`
- Light theme active by default
- Dark theme ready but commented out (can be enabled via `data-theme='dark'`)
- CSS variable naming:
  - `--background`: Main background color
  - `--main`: Primary brand color
  - `--grey-lv1/2/3`: Gray scale levels
  - `--font-black`: Main text color
  - `--notification`: Error/alert color

### Path Aliases

- `@/` maps to `src/` directory (configured in `vite.config.ts`)
- Always use `@/` imports for internal modules

## Code Patterns

### Component Documentation

All Vue components include extensive JSDoc-style comments in Korean explaining:

- Component role and responsibilities
- Component hierarchy and relationships
- Data flow patterns
- Event handling

When modifying components, maintain this documentation style.

### Event Communication

- AppHeader emits: `display-mode-change`, `toolbar-operation`
- ToolBar directly updates the store (no event bubbling needed for data operations)
- Event handlers in App.vue serve as extension points for analytics/logging

### Store Integration

Components access the store directly:

```typescript
import { useFileSystemStore } from '@/stores/DataComponents'
const fileSystemStore = useFileSystemStore()
```

Use computed properties to reactively track store state:

```typescript
const visibleCollections = computed(() => fileSystemStore.visibleCollections)
```

## Node Version

Requires Node.js `^20.19.0 || >=22.12.0` (specified in package.json engines)

## IDE Setup

Recommended: VSCode + Volar extension (Vetur should be disabled)
