interface Tag {
  text: string;
}

interface LocalConfig {
  [key: string]: string | boolean | number;
}

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
