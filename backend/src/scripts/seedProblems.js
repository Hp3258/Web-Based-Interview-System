import mongoose from "mongoose";
import dotenv from "dotenv";
import Problem from "../models/Problem.js";

dotenv.config({ path: "../../.env" });
dotenv.config();

const problems = [
  {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    category: "Array",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers in the array such that they add up to target.",
    testCases: [
      { input: "[2,7,11,15]\n9", expectedOutput: "[0,1]", isHidden: false },
      { input: "[3,2,4]\n6", expectedOutput: "[1,2]", isHidden: false },
      { input: "[3,3]\n6", expectedOutput: "[0,1]", isHidden: true }
    ],
    starterCode: {
      javascript: `function twoSum(nums, target) {\n  \n}\n\n// --- DO NOT MODIFY BELOW ---\nconst fs = require('fs');\ntry {\n  const lines = fs.readFileSync(0, 'utf-8').trim().split('\\n');\n  if (lines.length >= 2) {\n    const nums = JSON.parse(lines[0]);\n    const target = parseInt(lines[1]);\n    console.log(JSON.stringify(twoSum(nums, target)).replace(/\\s/g, ''));\n  }\n} catch (e) {}`,
      python: `import sys\nimport json\ndef twoSum(nums, target):\n    pass\n\n# --- DO NOT MODIFY BELOW ---\ntry:\n    lines = sys.stdin.read().strip().split('\\n')\n    if len(lines) >= 2:\n        nums = json.loads(lines[0])\n        target = int(lines[1])\n        print(json.dumps(twoSum(nums, target)).replace(' ', ''))\nexcept: pass`,
      java: `import java.util.*;\npublic class Main {\n    public static int[] twoSum(int[] nums, int target) {\n        return new int[0];\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if(sc.hasNextLine()) {\n            String l1 = sc.nextLine().replaceAll("[\\\\[\\\\]\\\\s]", "");\n            String[] p = l1.split(",");\n            int[] nums = new int[p.length];\n            for(int i=0; i<p.length; i++) nums[i] = Integer.parseInt(p[i]);\n            int target = sc.nextInt();\n            int[] r = twoSum(nums, target);\n            System.out.println("[" + r[0] + "," + r[1] + "]");\n        }\n    }\n}`,
      cpp: `#include <iostream>\n#include <vector>\n#include <string>\n#include <sstream>\nusing namespace std;\nvector<int> twoSum(vector<int>& nums, int target) {\n    return {};\n}\nint main() {\n    string l1, l2; getline(cin, l1); getline(cin, l2);\n    vector<int> nums;\n    for(char& c : l1) if(c=='[' || c==']' || c==',') c=' ';\n    stringstream ss(l1); int n; while(ss >> n) nums.push_back(n);\n    int target = stoi(l2);\n    vector<int> r = twoSum(nums, target);\n    if(r.size()==2) cout << "[" << r[0] << "," << r[1] << "]\\n";\n    return 0;\n}`
    }
  },
  {
    id: "reverse-string",
    title: "Reverse String",
    difficulty: "Easy",
    category: "String",
    description: "Write a function that reverses a string. The input string is given as an array of characters s.",
    testCases: [
      { input: "hello", expectedOutput: "olleh", isHidden: false },
      { input: "world", expectedOutput: "dlrow", isHidden: false },
      { input: "abcde", expectedOutput: "edcba", isHidden: true }
    ],
    starterCode: {
      javascript: `function reverseString(s) {\n  \n}\n\n// --- DO NOT MODIFY BELOW ---\nconst fs = require('fs');\ntry {\n  const s = fs.readFileSync(0, 'utf-8').trim().split('');\n  reverseString(s);\n  console.log(s.join(''));\n} catch(e) {}`,
      python: `import sys\ndef reverseString(s):\n    pass\n\n# --- DO NOT MODIFY BELOW ---\ntry:\n    s = list(sys.stdin.read().strip())\n    reverseString(s)\n    print("".join(s))\nexcept: pass`,
      java: `import java.util.*;\npublic class Main {\n    public static void reverseString(char[] s) {\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if(sc.hasNext()) {\n            char[] s = sc.next().toCharArray();\n            reverseString(s);\n            System.out.println(new String(s));\n        }\n    }\n}`,
      cpp: `#include <iostream>\n#include <vector>\n#include <string>\nusing namespace std;\nvoid reverseString(vector<char>& s) {\n}\nint main() {\n    string str; cin >> str;\n    vector<char> s(str.begin(), str.end());\n    reverseString(s);\n    for(char c : s) cout << c;\n    cout << endl;\n    return 0;\n}`
    }
  },
  {
    id: "valid-palindrome",
    title: "Valid Palindrome",
    difficulty: "Easy",
    category: "String",
    description: "Given a string s, return true if it is a palindrome, or false otherwise.",
    testCases: [
      { input: "racecar", expectedOutput: "true", isHidden: false },
      { input: "hello", expectedOutput: "false", isHidden: false },
      { input: "racecar", expectedOutput: "true", isHidden: true } // intentional dup for hidden
    ],
    starterCode: {
      javascript: `function isPalindrome(s) {\n  \n}\n\n// --- DO NOT MODIFY BELOW ---\nconst fs = require('fs');\ntry {\n  const s = fs.readFileSync(0, 'utf-8').trim();\n  console.log(isPalindrome(s));\n} catch(e) {}`,
      python: `import sys\ndef isPalindrome(s):\n    pass\n\n# --- DO NOT MODIFY BELOW ---\ntry:\n    s = sys.stdin.read().strip()\n    print(str(isPalindrome(s)).lower())\nexcept: pass`,
      java: `import java.util.*;\npublic class Main {\n    public static boolean isPalindrome(String s) {\n        return false;\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if(sc.hasNext()) {\n            System.out.println(isPalindrome(sc.next()));\n        }\n    }\n}`,
      cpp: `#include <iostream>\n#include <string>\nusing namespace std;\nbool isPalindrome(string s) {\n    return false;\n}\nint main() {\n    string str; cin >> str;\n    cout << (isPalindrome(str) ? "true" : "false") << endl;\n    return 0;\n}`
    }
  },
  {
    id: "maximum-subarray",
    title: "Maximum Subarray",
    difficulty: "Medium",
    category: "Array",
    description: "Given an integer array nums, find the subarray with the largest sum, and return its sum.",
    testCases: [
      { input: "-2 1 -3 4 -1 2 1 -5 4", expectedOutput: "6", isHidden: false },
      { input: "1", expectedOutput: "1", isHidden: false },
      { input: "5 4 -1 7 8", expectedOutput: "23", isHidden: true }
    ],
    starterCode: {
      javascript: `function maxSubArray(nums) {\n  \n}\n\n// --- DO NOT MODIFY BELOW ---\nconst fs = require('fs');\ntry {\n  const nums = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/).map(Number);\n  console.log(maxSubArray(nums));\n} catch(e) {}`,
      python: `import sys\ndef maxSubArray(nums):\n    pass\n\n# --- DO NOT MODIFY BELOW ---\ntry:\n    nums = list(map(int, sys.stdin.read().strip().split()))\n    print(maxSubArray(nums))\nexcept: pass`,
      java: `import java.util.*;\npublic class Main {\n    public static int maxSubArray(int[] nums) {\n        return 0;\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        List<Integer> list = new ArrayList<>();\n        while(sc.hasNextInt()) list.add(sc.nextInt());\n        int[] nums = new int[list.size()];\n        for(int i=0; i<list.size(); i++) nums[i] = list.get(i);\n        if(nums.length > 0) System.out.println(maxSubArray(nums));\n    }\n}`,
      cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\nint maxSubArray(vector<int>& nums) {\n    return 0;\n}\nint main() {\n    vector<int> nums;\n    int n; while(cin >> n) nums.push_back(n);\n    if(nums.size() > 0) cout << maxSubArray(nums) << endl;\n    return 0;\n}`
    }
  },
  {
    id: "container-with-most-water",
    title: "Container With Most Water",
    difficulty: "Medium",
    category: "Array",
    description: "Find two lines that together with the x-axis form a container, such that the container contains the most water.",
    testCases: [
      { input: "1 8 6 2 5 4 8 3 7", expectedOutput: "49", isHidden: false },
      { input: "1 1", expectedOutput: "1", isHidden: false },
      { input: "4 3 2 1 4", expectedOutput: "16", isHidden: true }
    ],
    starterCode: {
      javascript: `function maxArea(height) {\n  \n}\n\n// --- DO NOT MODIFY BELOW ---\nconst fs = require('fs');\ntry {\n  const h = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/).map(Number);\n  console.log(maxArea(h));\n} catch(e) {}`,
      python: `import sys\ndef maxArea(height):\n    pass\n\n# --- DO NOT MODIFY BELOW ---\ntry:\n    h = list(map(int, sys.stdin.read().strip().split()))\n    print(maxArea(h))\nexcept: pass`,
      java: `import java.util.*;\npublic class Main {\n    public static int maxArea(int[] height) {\n        return 0;\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        List<Integer> list = new ArrayList<>();\n        while(sc.hasNextInt()) list.add(sc.nextInt());\n        int[] h = new int[list.size()];\n        for(int i=0; i<list.size(); i++) h[i] = list.get(i);\n        if(h.length > 0) System.out.println(maxArea(h));\n    }\n}`,
      cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\nint maxArea(vector<int>& height) {\n    return 0;\n}\nint main() {\n    vector<int> h;\n    int n; while(cin >> n) h.push_back(n);\n    if(h.size() > 0) cout << maxArea(h) << endl;\n    return 0;\n}`
    }
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.DB_URL || "mongodb://localhost:27017/interview_system");
    console.log("Connected to DB");
    await Problem.deleteMany({});
    console.log("Cleared existing problems");
    await Problem.insertMany(problems);
    console.log("Seeded 5 problems successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding problems:", error);
    process.exit(1);
  }
}

seed();
