import type {
  ExtensionModelInstanceInterface,
  ExtensionModelInterface,
  TexditorInterface
} from "@/types";
import { addClass, append, make, query, queryLength } from "@/utils";

export default function ExtensionsView(
  editor: TexditorInterface
): HTMLElement | Node {
  const { config, events } = editor,
    cssName = 'tex-extensions',
    extensionList = config.get("extensions", []);

  events.trigger("extensions:view");

  if (!extensionList?.length) return document.createTextNode("");

  const bar = make("div", (el: HTMLDivElement) => {
    const ltr = config.get("extensionsLtr", "left");
    addClass(el, cssName + " tex-" + ltr);

    // Cast through unknown to handle type mismatch
    (extensionList as unknown as ExtensionModelInstanceInterface[]).forEach(
      (ExtClass: ExtensionModelInstanceInterface) => {
        const extInstance: ExtensionModelInterface = new ExtClass(editor);

        if (extInstance?.create) {
          const element = extInstance.create(),
            groupName = extInstance.getGroupName
              ? extInstance.getGroupName()
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
        }
      }
    );
  });

  events.trigger("extensions:view:end", { el: bar });

  return bar;
}
