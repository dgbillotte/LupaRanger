from functools import reduce
from itertools import zip_longest

rules_lookup = {}
rules_lookup["CH"] = "B"
rules_lookup["HH"] = "N"
rules_lookup["CB"] = "H"
rules_lookup["NH"] = "C"
rules_lookup["HB"] = "C"
rules_lookup["HC"] = "B"
rules_lookup["HN"] = "C"
rules_lookup["NN"] = "C"
rules_lookup["BH"] = "H"
rules_lookup["NC"] = "B"
rules_lookup["NB"] = "B"
rules_lookup["BN"] = "B"
rules_lookup["BB"] = "N"
rules_lookup["BC"] = "B"
rules_lookup["CC"] = "N"
rules_lookup["CN"] = "C"

work = "NNCB"
for _ in range(10):
    print(work)
    work = reduce(lambda out, chunk: out + chunk,
        (pair[0] + rules_lookup[pair[0]+pair[1]] if pair[1] != '' else pair[0]
            for pair in zip_longest(work, work[1:], fillvalue='')))

print(work)