const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const path = require("path");
const { User, Account } = require("./db");
const { userValidationSignUp, userValidationLogin } = require("./auth");

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = "your_jwt_secret";

app.use(cors());
app.use(bodyParser.json());

const buildPath =
  (__dirname, "/Users/prakhar/wr-project-final/WebTech/frontend/dist"); //
app.use(express.static(buildPath));

const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Authorization token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

app.post("/signup", userValidationSignUp, async (req, res) => {
  const { username, password, firstName, lastName } = req.body;

  try {
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: "This Email is already used" });
    }

    const newUser = new User({ username, password, firstName, lastName });
    await newUser.save();

    const newAccount = new Account({ userId: newUser._id, amount: 100000 });
    await newAccount.save();

    res.status(201).json({
      message: "SignUp Successful",
      amount: newAccount.amount,
    });
  } catch (err) {
    res.status(500).json({
      message: "Something went wrong",
      error: err.message,
    });
  }
});

app.post("/login", userValidationLogin, async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (user && user.password === password) {
      const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
        expiresIn: "1h",
      });

      res.status(200).json({
        message: "Logged In",
        token,
      });
    } else {
      res.status(400).json({
        message: "Wrong Credentials",
      });
    }
  } catch (err) {
    res.status(500).json({
      message: "Something went wrong",
      error: err.message,
    });
  }
});

app.get("/wallet", authenticateToken, async (req, res) => {
  const { userId } = req.user;

  try {
    const account = await Account.findOne({ userId });

    if (!account) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    res.status(200).json({
      balance: account.amount,
    });
  } catch (err) {
    res.status(500).json({
      message: "Something went wrong",
      error: err.message,
    });
  }
});

const TOTAL_DROPS = 16

const MULTIPLIERS = {
  0: 16,
  1: 9,
  2: 2,
  3: 1.4,
  4: 1.4,
  5: 1.2,
  6: 1.1,
  7: 1,
  8: 0.5,
  9: 1,
  10: 1.1,
  11: 1.2,
  12: 1.4,
  13: 1.4,
  14: 2,
  15: 9,
  16: 16
}

app.post("/game", (req, res) => {
  let outcome = 0
  const pattern = []
  for (let i = 0; i < TOTAL_DROPS; i++) {
    if (Math.random() > 0.5) {
      pattern.push("R")
      outcome++
    } else {
      pattern.push("L")
    }
  }

  const multiplier = MULTIPLIERS[outcome]
  const possiblieOutcomes = outcomes[outcome]

  res.send({
    point:
      possiblieOutcomes[
        Math.floor(Math.random() * possiblieOutcomes.length || 0)
      ],
    multiplier,
    pattern
  })
})

app.post("/wallet/deposit", async (req, res) => {
  const { username, amount } = req.body;

  if (!username) {
    return res.status(400).json({
      message: "Username is required",
    });
  }

  if (amount <= 0) {
    return res.status(400).json({
      message: "Amount should be greater than zero",
    });
  }

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const account = await Account.findOne({ userId: user._id });

    if (!account) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    if (!account.transactions) {
      account.transactions = [];
    }

    account.amount += Number(amount);

    account.transactions.push({ type: "Deposit", amount, date: new Date() });

    await account.save();

    res.status(200).json({
      message: "Deposit successful",
      balance: account.amount,
    });
  } catch (err) {
    res.status(500).json({
      message: "Something went wrong",
      error: err.message,
    });
  }
});

app.post("/wallet/withdraw", async (req, res) => {
  const { username, amount } = req.body;

  if (!username) {
    return res.status(400).json({
      message: "Username is required",
    });
  }

  if (amount <= 0) {
    return res.status(400).json({
      message: "Amount should be greater than zero",
    });
  }

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const account = await Account.findOne({ userId: user._id });

    if (!account) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    if (!account.transactions) {
      account.transactions = [];
    }

    if (account.amount < amount) {
      return res.status(400).json({
        message: "Insufficient balance",
      });
    }

    account.amount -= amount;

    account.transactions.push({ type: "Withdrawal", amount, date: new Date() });

    await account.save();

    res.status(200).json({
      message: "Withdrawal successful",
      balance: account.amount,
    });
  } catch (err) {
    res.status(500).json({
      message: "Something went wrong",
      error: err.message,
    });
  }
});

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.post("/wallet/update", authenticateToken, async (req, res) => {
  const { balance, gameResult, betAmount } = req.body;
  const { userId } = req.user;

  if (balance === undefined || balance < 0) {
    return res.status(400).json({ message: "Invalid balance amount" });
  }

  try {
    const account = await Account.findOne({ userId });

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    // Update account balance
    account.amount = balance;

    // Handle transaction history
    let transactionType;
    let transactionAmount = Math.abs(balance - account.amount);

    switch (gameResult) {
      case "blackjack":
        transactionType = "Blackjack Win (Blackjack)";
        break;
      case "dealer_bust":
      case "player_wins":
        transactionType = "Blackjack Win";
        break;
      case "push":
        transactionType = "Blackjack Push";
        break;
      case "bust":
      case "dealer_wins":
        transactionType = "Blackjack Loss";
        break;
      default:
        transactionType = "Game Transaction";
    }

    if (!account.transactions) {
      account.transactions = [];
    }

    account.transactions.push({
      type: transactionType,
      amount: betAmount,
      date: new Date(),
    });

    await account.save();

    res.status(200).json({
      message: "Balance updated successfully",
      balance: account.amount,
      transaction: account.transactions[account.transactions.length - 1],
    });
  } catch (err) {
    console.error("Wallet update error:", err);
    res.status(500).json({
      message: "Error updating balance",
      error: err.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Server running successfully on port ${port}`);
});



const outcomes = {
  "0": [],
  "1": [3964963.452981615, 3910113.3998412564],
  "2": [
    3980805.7004139693,
    3945617.6504109767,
    4027628.395823398,
    3902115.8620758583,
    3938709.5467746584
  ],
  "3": [
    3975554.824601942,
    3965805.769610554,
    3909279.443666201,
    3940971.550465178,
    3909606.717374134,
    3915484.1741136736,
    3977018.430328505,
    3979167.5933461944,
    3995981.0273005674,
    3974177.78840204
  ],
  "4": [
    3943174.7607756723,
    3992961.0886867167,
    3914511.2798374896,
    3950487.300703086,
    3973378.3900412438,
    4012888.985549594,
    4040961.8767680754,
    4066503.3857407006,
    3944573.7194061875,
    3979876.769324002,
    4042712.772834604,
    4032991.0303322095,
    4046340.7919081766,
    3912597.9665436875,
    4068852.495940549,
    4064879.257329362,
    3996796.04239161,
    4045062.2783860737,
    3964680.919169739
  ],
  "5": [
    3953045.1447091424,
    3947374.62976226,
    3924082.6101653073,
    3919085.269354398,
    3902650.4008744615,
    3934968.1593932374,
    4044126.7590222214,
    3928499.8807134246,
    3913801.9247018984,
    3909595.4432100505,
    4082827.827013994,
    3979739.108665962,
    4077651.317785833,
    4008030.8883127486,
    3950951.6007580766,
    3992039.9053288833,
    4021810.0928285993,
    4052650.560434505,
    3994806.267259329,
    3959327.3735489477,
    3940455.7641962855,
    3998822.2807239015,
    3998803.9335444313,
    4068193.3913483596,
    3938798.911585438
  ],
  "6": [
    4065643.7049927213,
    3936841.961313155,
    3948472.8991447487,
    4004510.5975928125,
    3933695.6888747592,
    4011296.1958215656,
    4093232.84383817,
    3945658.6170622837,
    4063199.5117669366,
    4037864.799653558,
    3931477.3517858014,
    4091381.513010509,
    4000895.053297006,
    4042867.6535872207,
    4090947.938511616,
    3989468.333758437,
    3943335.764879169,
    3947278.536321405,
    4022304.817103859,
    3902177.8466275427,
    3925270.959381573,
    3955253.4540312397,
    3986641.0060988157,
    3927696.2396482667,
    4064571.150949869,
    3991167.946685552,
    3973041.308793569,
    3987377.180906899,
    3917262.667253392,
    4002606.795366179,
    4033596.992526079,
    3901372.366183016,
    4015207.583244224,
    3955421.290959922,
    3952223.0425123484,
    3941774.4498685915,
    3977289.3718391117,
    4024943.3014183883,
    4024885.5052148327,
    4016596.7449097126,
    3910164.1864616796,
    4023400.498352244,
    3981421.8628830933,
    3913377.3496230906,
    4045958.9425667236,
    4071139.892029292,
    4019862.922309672,
    4027992.2300945413,
    4030455.1701347437,
    4060673.10227606,
    3996564.062673036,
    4009801.4052053,
    4007734.404953163,
    4046612.754675019,
    3944956.9979153597,
    3977382.889196781,
    3906636.5132748624,
    4080470.0674178666,
    3996210.4877184015,
    3956216.294023866,
    3940040.183231992
  ],
  "7": [
    3926739.9104774813,
    4091374.44234272,
    4061919.9903071183,
    3976066.7555194413,
    3948801.1936986246,
    4043233.7830772344,
    4010011.7658794387,
    3936431.4108806592,
    3942776.8649452417,
    3909995.011479453,
    4012272.43979473,
    3989907.069429411,
    3996182.4336681785,
    4078644.79693604,
    4081624.0834239917,
    4025044.731614778,
    4033602.5381773794,
    3913189.826642105,
    3910500.674962151,
    4055296.6588616692,
    4005574.8641647273,
    4079800.3518520766,
    4092763.5236495608,
    3952185.4910905147,
    3945510.495018459,
    3920891.8818843197,
    3997101.789672143,
    3991974.822516503,
    3949265.4371072412,
    3933412.4749754136,
    3933181.8312838264,
    4063875.6616431624,
    3998206.7252218956,
    3959006.1987530286,
    3924067.917601976,
    3902914.4459602935,
    3905347.098696195,
    4000831.565288375,
    3944915.3251241,
    3930343.481158048,
    4025858.616981573,
    4026496.026592473,
    3948116.019901921,
    4067143.737297127,
    3995156.000931595,
    3905006.3301882823,
    4035783.4852589793,
    3956461.6106608217,
    4032886.6912715673,
    3913146.10237042,
    3930772.085213345,
    3984887.619042549,
    4053031.0321973227,
    3913395.137097174,
    3993579.678508536,
    3932427.236196532,
    3984279.0886106077
  ],
  "8": [
    4099062.75134143,
    4085894.4181278455,
    3991123.0115790954,
    3973053.5827605873,
    3968190.564301313,
    3925604.5066868863,
    3933898.7590061547,
    4089919.7991958153,
    4076997.5225973814,
    3957630.60529322,
    3948999.35996541,
    3963938.9455971997,
    4044805.7991237757,
    3905133.2109927135,
    4074463.6876271376,
    3939301.0655442886,
    4040571.320635691,
    4020510.19979044,
    3959835.4618981928,
    4037241.67248416,
    4043105.87901907,
    3912654.2409310103,
    3929773.262095125,
    3950802.527033251,
    4068582.4605300324,
    3946792.6177569656,
    4078475.9982660934,
    3972024.763383927,
    3947150.677862883,
    3963410.9779685168,
    3999134.851845996,
    3909374.1117644133,
    3942761.896008833,
    4071253.4107468165,
    4050534.50171971,
    3988521.4618817912,
    3929940.089627246,
    4029305.1056314665,
    4087943.221841722,
    3910909.3079385986,
    4046944.0552393594,
    4006944.159180551,
    4014707.657017377,
    3925473.574267122,
    4012158.905329344,
    4042197.149473071,
    3998434.6078570196,
    4047267.2747256896,
    3964753.3725316986,
    3955821.0222197613,
    3973475.662585886,
    3917189.0280630635,
    4027132.7848505056,
    3905368.7668914935,
    3936654.62186107,
    4092566.3229272505,
    4026541.0685970024,
    4038770.6420815475,
    4067262.4257867294,
    4050430.5327158393,
    3980149.8069138955,
    4052184.5678737606,
    3942299.598280835,
    4079754.687607573,
    4021112.5651541506,
    3961023.3381184433,
    3937025.1424917267,
    3964607.486702018,
    4001319.0133674755,
    3941648.5232227165,
    4030587.9685114417,
    4044067.1579758436,
    4058158.522928313
  ],
  "9": [
    3911530.315770063,
    4024711.492410591,
    3967652.4297853387,
    4098886.3793751886,
    4026117.0283389515,
    4045045.4095477182,
    4034571.220507859,
    4088809.303306565,
    3900806.968890352,
    3913166.9251142726,
    4059594.3600833854,
    3945137.694311404,
    3902668.8160601873,
    4054646.2889849013,
    4053898.6542759663,
    3959251.11275926,
    3963475.882565954,
    3967968.9310842347,
    4075078.929914972,
    4035117.4533019722,
    4047608.2592268144,
    3913024.5010530455,
    4081362.0390194473,
    4098538.7144543654,
    4049336.7774994993,
    4056844.5727342237,
    3917845.6810319433,
    4098332.1779752634,
    3979547.7686487637,
    4026747.155594485,
    3944692.803167993,
    3960649.105237204,
    4081040.2295870385,
    4005698.9658651184,
    4074183.694152899,
    3976184.3586868607,
    4007157.5084493076,
    3918927.3398626954,
    3918166.0285542854,
    3953868.3374998523,
    3963648.6249533077,
    4065036.1837552087,
    3964230.698479104,
    3992799.530672317,
    3931113.922813188,
    4082916.6661583954,
    3919236.111874976,
    4012743.1541231154,
    3900406.2441578982,
    4031396.764516756,
    4088712.2834741194,
    3921570.4946371615,
    4077416.64169384,
    3962807.6000533635
  ],
  "10": [
    4069582.648305392,
    3966300.3577461895,
    4047184.7847023425,
    3962656.256238744,
    3934682.0223851865,
    4089620.291559703,
    3996605.065672608,
    3921656.567101851,
    3950930.30704122,
    4052733.606190915,
    4046762.051641918,
    3912718.72211605,
    3942094.6698735086,
    4017504.735499972,
    4016206.1612997893,
    4060896.040328729,
    4077224.686824909,
    3988932.185505723,
    4016550.502499315,
    3959104.134236025,
    3903531.023685199,
    3939907.5585800377,
    3969464.753065079,
    4036549.7059165714,
    3938844.715578784,
    3985594.4268763512,
    4011615.276676018,
    3949739.058361909,
    4064041.8926257566,
    4004767.498301687,
    3996411.8026064364,
    4035064.3182208547,
    3988008.7378418343,
    4015638.96642283,
    3967068.722994021,
    4082965.2856357233,
    3951302.134707721,
    3948101.1830631103,
    3978745.8509503608,
    4068638.265329366,
    4018433.726155858,
    4032765.523475676
  ],
  "11": [
    4055462.593704495,
    4027576.362231998,
    4011290.7395424685,
    4034848.6574270525,
    4064298.598636101,
    3997022.919190929,
    4053625.932623065,
    4064234.3514714935,
    4075348.9710445153,
    4060118.5348266517,
    4065992.932112665,
    4063162.143518177,
    4060798.1858924176,
    3956764.654354398,
    3912916.1668887464,
    4018282.0763658765,
    4065575.3280486814,
    3967348.3916016137,
    4034992.477051428,
    4069123.2018048204,
    3939281.4172981237,
    4022103.802712647,
    4083993.320300048,
    4034478.871034405,
    4068844.513451607,
    4097187.535489012,
    3981130.4047553614,
    4068312.6406908804,
    4050921.0879167155,
    4048297.277514315,
    3953878.475004285,
    3998627.3710734197
  ],
  "12": [
    4007152.5182738686,
    4014664.8542149696,
    4095619.5802802853,
    4018084.7270321106,
    4072050.3744347296,
    4026256.723716898,
    4095827.9573665825,
    4023631.9896559394,
    4046751.9125588783,
    3973758.674124694,
    4081927.075527175,
    3922485.387310559,
    4001549.2805312183,
    4050417.849670596,
    3987607.4531957353,
    4060206.9664999805,
    4080316.8473846694,
    4030455.1532406537,
    4087714.965906726,
    4028165.0792610054,
    4032588.5261474997,
    3980546.468460318,
    4090408.033691761,
    3990019.103297975,
    4088755.998466496,
    4092162.22327816,
    4029036.6583707742,
    4055066.505591603,
    4081998.821392285,
    4079550.553314541
  ],
  "13": [
    3905319.849889843,
    4054719.0660902266,
    4055596.4319745116,
    3992648.989962779,
    3924972.5941170114,
    4095167.7814041013,
    3912740.1944122575,
    4024882.9438952096,
    4023171.3988155797,
    4059892.954049364,
    4068510.96886605,
    4093838.431690223,
    4070524.1327491063
  ],
  "14": [
    4092261.8249403643,
    3956304.3865069468,
    4069053.2302732924,
    4038890.8473817194
  ],
  "15": [
    4013891.110502415,
    3977489.9532032954,
    4044335.989753631,
    4066199.8081775964
  ],
  "16": [3979706.1687804307, 4024156.037977316],
  "17": []
}
