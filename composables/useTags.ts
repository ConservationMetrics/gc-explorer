type Tag = { text: string };

type LocalConfig = Record<string, string | boolean | number>;

/**
 * Updates and manages tag data for configuration components.
 *
 * This function is used in Config components like to handle
 * dynamic tag input fields. It initializes the tags with given values and
 * provides a handler to update both the tags and the local configuration
 * whenever the tags change.
 *
 * @param {Record<string, Tag[]>} initialTags - An object containing initial tag arrays keyed by their respective configuration fields.
 * @param {LocalConfig} localConfig - A reactive object representing the local configuration, which will be updated based on tag changes.
 * @returns {Object} An object containing:
 *   - `tags`: A ref to the current state of tags, allowing for reactivity in the UI.
 *   - `handleTagsChanged`: A function to update tags and the local configuration when tags are modified.
 */
export function updateTags(
  initialTags: Record<string, Tag[]>,
  localConfig: LocalConfig,
): {
  tags: Ref<Record<string, Tag[]>>;
  handleTagsChanged: (_key: string, _newTags: Tag[]) => void;
} {
  const tags = ref(initialTags);

  const handleTagsChanged = (key: string, newTags: Tag[]): void => {
    tags.value[key] = newTags;
    localConfig[key] = newTags.map((tag) => tag.text).join(",");
  };

  return {
    tags,
    handleTagsChanged,
  };
}
