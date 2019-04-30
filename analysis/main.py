#!/usr/bin/env python3

import json, numpy, csv

def main():
    with open("profiles.json", "r") as profilesFile:
        profilesRaw = profilesFile.read()

    profiles = json.loads(profilesRaw)

    print("Found {} profiles".format(len(profiles)))

    with open("games.json", "r") as gamesFile:
        gamesRaw = gamesFile.read()

    games = json.loads(gamesRaw)

    # Clean data
    for i in range(len(profiles)-1, -1, -1):
        p = profiles[i]
        data = json.loads(p["profileData"])

        # Count how many exact 0.5s there are
        unsetCount = 0
        for attr in data:
            if data[attr] == 0.5:
                unsetCount += 1

        if unsetCount >= 2:
            del profiles[i]

    print("Cleaned to {} profiles".format(len(profiles)))

    allAttrs = ["o", "c", "e", "a", "n"]

    #graphAttributes(profiles, ["o", "c", "e", "a", "n"])

    #graphGames(games)

    graphRelationships(games, profiles, allAttrs, False)

def graphAttributes(profiles, attrs):
    grapherFile = open("graphing.csv", "w")
    writer = csv.writer(grapherFile, "excel")

    for p in profiles:
        data = json.loads(p["profileData"])
        writer.writerow([p["id"]] + [data[x] for x in attrs])
    
    grapherFile.close()


def graphGames(games):
    grapherFile = open("graphing.csv", "w")
    writer = csv.writer(grapherFile, "excel")

    for g in games:
        opinions = json.loads(g["opinions"])
        ids = json.loads(g["userids"])
        tempRow = [g["id"]] + ["liked", "disliked"] * 5
        
        writer.writerow(tempRow)

        tempRow = [""]

        for x in ids:
            tempRow += [str(x), str(x)]

        writer.writerow(tempRow)

        tempRow = [""]

        for i in ids:
            op = {}
            if str(i) in opinions:
                op = opinions[str(i)]

            if "mostLiked" in op:
                tempRow.append(op["mostLiked"])
            else:
                tempRow.append("")

            if "leastLiked" in op:
                tempRow.append(op["leastLiked"])
            else:
                tempRow.append("")

        writer.writerow(tempRow)

    grapherFile.close()


def graphRelationships(games, profiles, attrs, mostLiked):
    grapherFile = open("graphing.csv", "w")
    writer = csv.writer(grapherFile, "excel")

    for g in games:
        opinions = json.loads(g["opinions"])
        ids = json.loads(g["userids"])
        gameid = g["id"]

        for i in ids:
            p = findProfile(i, profiles)
            if not p:
                continue

            op = {}
            if str(i) in opinions:
                op = opinions[str(i)]

            searchStr = ("mostLiked" if mostLiked else "leastLiked")
            if searchStr in op:
                attrs1 = json.loads(p["profileData"])

                p2 = findProfile(op[searchStr], profiles)
                if not p2:
                    continue

                attrs2 = json.loads(p2["profileData"])

                tempRow = []

                for attr in attrs:
                    tempRow += [attrs1[attr], attrs2[attr]]

                writer.writerow(tempRow)

            #if "leastLiked" in op:
            #    tempRow.append(op["leastLiked"])
            #else:
            #    tempRow.append("")

    grapherFile.close()
        

def findProfile(i, profiles):
    for j in profiles:
        if j["id"] == str(i):
            return j

    return False


if __name__ == "__main__":
    main()
