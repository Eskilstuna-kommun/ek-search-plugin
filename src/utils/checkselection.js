function cleanItem(item) {
  const tempItem = item.getFeature().getProperties();
  if (tempItem.geometry) { delete tempItem.geometry; }
  if (tempItem.textHtml) { delete tempItem.textHtml; }
  if (tempItem.geom) { delete tempItem.geom; }
  if (tempItem.state) { delete tempItem.state; }
  return JSON.stringify(tempItem);
}

const checkExistingSelection = function checkExistingSelection(item, selectionManager) {
  let returnBool = true;

  const selectionGroup = item.getSelectionGroup();
  const selectedItems = selectionManager.getSelectedItemsForASelectionGroup(selectionGroup);
  const tempItem = cleanItem(item);

  selectedItems.forEach((selectedItem) => {
    const tempSelectedItem = cleanItem(selectedItem);
    if (tempSelectedItem === tempItem) {
      returnBool = false;
    }
  });

  return returnBool;
};

export default checkExistingSelection;
