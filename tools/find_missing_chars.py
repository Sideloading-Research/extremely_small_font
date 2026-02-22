# Latin alphabet we have
import string

# Characters that look identical or close enough in a 4x3 pixel grid.
# Mappings from Russian/German/Spanish to Latin
# Russian
# А -> A
# В -> B
# Е -> E
# З -> 3 (number)
# К -> K
# М -> M
# Н -> H
# О -> O
# Р -> P
# С -> C
# Т -> T
# У -> Y
# Х -> X
# Ь -> b
# а -> a
# е -> e
# о -> o
# р -> p
# c -> c
# у -> y
# х -> x
#
russian = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя"
german = "ÄÖÜßäöü" # base latin is covered
spanish = "ÁÉÍÓÚÜÑáéíóúüñ¿¡" # base latin is covered

mapping_to_existing = {
    'А': 'A', 'В': 'B', 'Е': 'E', 'К': 'K', 'М': 'M', 'Н': 'H', 'О': 'O', 'Р': 'P', 'С': 'C', 'Т': 'T', 'У': 'Y', 'Х': 'X',
    'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c', 'у': 'y', 'х': 'x', 'Ь': 'b', 'З': '3'
}

existing = set(string.ascii_letters + string.digits + ".,:;/?+-=_!&*$()[]{}<>|'\"#~^" + "ₒ₁₂₃₄₅₆₇₈₉")

missing = []

print("Russian missing:")
for c in russian:
    if c not in mapping_to_existing and c not in existing:
        missing.append(c)
        print(c, end=" ")
print("\n")

print("German missing:")
for c in german:
    if c not in mapping_to_existing and c not in existing:
        missing.append(c)
        print(c, end=" ")
print("\n")

print("Spanish missing:")
for c in spanish:
    if c not in mapping_to_existing and c not in existing:
        missing.append(c)
        print(c, end=" ")
print("\n")

with open('missing_characters.txt', 'w') as f:
    for c in sorted(missing):
        f.write(c + "\n")
