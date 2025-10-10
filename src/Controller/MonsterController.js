const Monster = require("../Model/MonsterModel");
const User = require("../Model/UserModel");

exports.createMonster = async (req, res) => {
  try {
    const { eyes, heads, wings, base, arms, tentacles } = req.body;
    const userId = req.user.userId;

    const monster = await Monster.create({
      eyes,
      heads,
      wings,
      base,
      arms,
      tentacles,
      createdBy: userId,
      role: "user",
    });

    res.status(201).json({ msg: "Monster created successfully", monster });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};


exports.getAllMonsters = async (req, res) => {
  try {
    // Fetch only monsters created by users
    const monsters = await Monster.find()
      .populate({
        path: "createdBy",
        select: "name email role",
        match: { role: "user" }, // only users
      })
      .sort({ createdAt: -1 });

    // Remove monsters where createdBy is null (admins won't match)
    const filteredMonsters = monsters.filter(monster => monster.createdBy);

    if (filteredMonsters.length === 0) {
      return res.status(404).json({
        success: false,
        msg: "No monsters found created by users",
      });
    }

    res.status(200).json({
      success: true,
      count: filteredMonsters.length,
      monsters: filteredMonsters,
    });
  } catch (error) {
    console.error("Error fetching monsters:", error.message);
    return res.status(500).json({
      success: false,
      msg: "Server error while fetching monsters",
    });
  }
};

exports.getAllCreatedMonsters = async (req, res) => {
  try {
    const monsters = await Monster.find()
      .populate({
        path: "createdBy",
        select: "name email",
        match: { role: "admin" },
      })
      .sort({ createdAt: -1 });

    const filteredMonsters = monsters
      .filter(monster => monster.createdBy)
      .map(monster => ({
        ...monster.toObject(),
        imageUrl: monster.monster_image?.secure_url || null,
      }));

    res.status(200).json({
      success: true,
      count: filteredMonsters.length,
      monsters: filteredMonsters,
    });
  } catch (error) {
    console.error("Error fetching monsters:", error.message);
    return res.status(500).json({
      success: false,
      msg: "Server error while fetching monsters",
    });
  }
};














