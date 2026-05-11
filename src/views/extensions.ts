import type { TexditorInterface } from "@/types";
import { addClass, append, executeMethodIfExists, make, query, queryLength } from "@/utils";

export default function ExtensionsView(
  editor: TexditorInterface
): HTMLElement | Node {
  const { config, extensions } = editor,
    cssName = 'tex-extensions',
    extensionList = extensions.getExtensions();

  if (!extensionList.length) return document.createTextNode("");

  const bar = make("div", (el: HTMLDivElement) => {
    const ltr = config.get("extensionsLtr", "left");
    addClass(el, cssName + " tex-" + ltr);

    extensionList.forEach((extension) => {
      const element = extension.getElement(),
        groupName = extension.getGroupName
          ? extension.getGroupName()
          : "";

      if (groupName) {
        const isExists = !!queryLength(
          "." + cssName + "-group-" + groupName,
          el
        );

        if (isExists) {
          query(
            "." + cssName + "-group-" + groupName,
            (group: HTMLElement) => {
              append(group, element);
            },
            el
          );
        } else {
          const groupElement = make("div", (group: HTMLElement) => {
            addClass(
              group,
              cssName + "-group-" + groupName + " " + cssName + "-group"
            );
            append(group, element);
          });

          append(el, groupElement);
        }
      } else append(el, element);

      executeMethodIfExists(extension, '__onMount', [element]);
    })
  });

  return bar;
}
