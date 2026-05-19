extends Node
## Carrega definições de cartas a partir de JSON e/ou Resources (.tres).
## Conteúdo expansível: novas cartas = novo arquivo ou entrada em array.

const DEFAULT_PACK_PATH := "res://data/packs/starter_pack.json"

var _cards: Dictionary = {} ## card_id -> Dictionary (definição normalizada)


func _ready() -> void:
	reload()


func reload(path: String = DEFAULT_PACK_PATH) -> void:
	_cards.clear()
	if not FileAccess.file_exists(path):
		push_warning("CardDatabase: arquivo não encontrado: %s" % path)
		return
	var f := FileAccess.open(path, FileAccess.READ)
	var text := f.get_as_text()
	var parsed: Variant = JSON.parse_string(text)
	if parsed == null or typeof(parsed) != TYPE_DICTIONARY:
		push_error("CardDatabase: JSON inválido em %s" % path)
		return
	var root: Dictionary = parsed
	for entry in root.get("cards", []):
		if typeof(entry) != TYPE_DICTIONARY:
			continue
		var id: String = String(entry.get("id", ""))
		if id.is_empty():
			continue
		_cards[id] = entry


func get_card(card_id: String) -> Dictionary:
	return _cards.get(card_id, {})


func all_card_ids() -> PackedStringArray:
	var keys := _cards.keys()
	keys.sort()
	var out := PackedStringArray()
	for k in keys:
		out.append(String(k))
	return out
