/**
 * APIエンドポイント定数
 */
export const API_ENDPOINT = {
  HEALTH: "/api/v1/health",
  USER: "/api/v1/user",
  USER_LOGIN: "/api/v1/user-login",
  REFRESH: "/api/v1/refresh",
  VERIFY: "/api/v1/verify",
  USER_LOGOUT: "/api/v1/user-logout",
  USER_PASSWORD: "/api/v1/user-password",
  USER_DARK_MODE: "/api/v1/user/dark-mode",
  BOOKS: "/api/v1/books",
  BOOKS_ID: "/api/v1/books/:bookId",
  BOOKS_ID_READING_PROGRESS: "/api/v1/books/:bookId/reading-progress",
  BOOKS_ID_TAGS_ID: "/api/v1/books/:bookId/tags/:tagId",
  BOOKS_ID_WORKS: "/api/v1/books/:bookId/works",
  WORKS_ID: "/api/v1/works/:workId",
  WORKS_ID_POSITION: "/api/v1/works/:workId/position",
  WORKS_ID_CHARACTERS: "/api/v1/works/:workId/characters",
  WORKS_ID_CHARACTER_RELATIONS: "/api/v1/works/:workId/character-relations",
  WORKS_ID_STORY_EVENTS: "/api/v1/works/:workId/story-events",
  WORKS_ID_WORDS: "/api/v1/works/:workId/words",
  CHARACTERS_ID: "/api/v1/characters/:characterId",
  CHARACTER_RELATIONS_ID: "/api/v1/character-relations/:relationId",
  STORY_EVENTS_ID: "/api/v1/story-events/:eventId",
  STORY_EVENTS_ID_POSITION: "/api/v1/story-events/:eventId/position",
  WORDS_ID: "/api/v1/words/:wordId",
  TAGS: "/api/v1/tags",
  TAGS_ID: "/api/v1/tags/:tagId",
} as const;

export type ApiEndpointType = (typeof API_ENDPOINT)[keyof typeof API_ENDPOINT];
