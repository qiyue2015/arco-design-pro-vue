<script setup lang="ts">
  import { watch, useAttrs } from 'vue';
  import { EditorContent, useEditor } from '@tiptap/vue-3';
  import StarterKit from '@tiptap/starter-kit';
  import type { AnyExtension } from '@tiptap/vue-3';
  import Placeholder from '@tiptap/extension-placeholder';
  import ControlGroup from '@/components/tiptap/control-group.vue';
  import Highlight from '@tiptap/extension-highlight';
  import Underline from '@tiptap/extension-underline';
  import Color from '@tiptap/extension-color';
  import TextAlign from '@tiptap/extension-text-align';
  import TextStyle from '@tiptap/extension-text-style';
  import { FontSize } from './extensions/FontSize';
  import Image from './extensions/Image';

  const emits = defineEmits(['update:modelValue']);

  const attrs = useAttrs();

  const props = defineProps({
    modelValue: {
      type: String,
      default: '',
    },
  });

  const tiptapEditor = useEditor({
    content: props.modelValue,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }) as AnyExtension,
      Placeholder.configure({
        placeholder: attrs?.placeholder as string,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Image.configure({
        inline: true,
      }),
      Highlight,
      Underline,
      Color,
      TextStyle,
      FontSize,
    ],
    onUpdate: ({ editor }) => {
      emits('update:modelValue', editor.getHTML());
    },
  });

  watch(
    () => props.modelValue,
    (value) => {
      if (tiptapEditor.value && value !== tiptapEditor.value.getHTML()) {
        tiptapEditor.value.commands.setContent(value);
      }
    }
  );
</script>

<template>
  <div v-if="tiptapEditor" class="tiptap-editor-wrapper">
    <control-group :editor="tiptapEditor" />
    <div class="editor-content-wrapper">
      <editor-content :editor="tiptapEditor" class="editor-content" />
    </div>
  </div>
</template>

<style lang="less" scoped>
  .tiptap-editor-wrapper {
    width: 100%;
    position: relative;
    border: 1px solid var(--color-border-2);
    border-radius: var(--border-radius-small);
  }

  .editor-content-wrapper {
    width: 100%;
    display: inline-flex;
    position: relative;
    overflow: hidden;
    box-sizing: border-box;
    padding: 12px;
    color: var(--color-text-1);
    font-size: 14px;
    cursor: text;

    .editor-content {
      width: 100%;
      height: 380px;
      position: relative;
      scrollbar-width: none;
      overflow: auto;
    }

    :deep(.tiptap) {
      :first-child {
        margin-top: 0;
      }

      height: 100%;
      box-sizing: border-box;
      font-family: sans-serif;
      line-height: 1.8;
      overflow-x: auto;
      text-align: left;
      outline: none;

      p {
        margin: 1em 0;

        &.is-empty::before {
          color: rgb(var(--gray-6));
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
      }
    }
  }
</style>
