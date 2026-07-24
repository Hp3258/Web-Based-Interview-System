import fs from 'fs';

const problems = {
  "two-sum": {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    category: "Array",
    description: {
      text: "Given an array of integers nums and an integer target, return indices of the two numbers in the array such that they add up to target.",
      notes: []
    },
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]" },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]" }
    ],
    constraints: [],
    starterCode: {
      javascript: `function twoSum(nums, target) {\n  \n}\n\n// --- DO NOT MODIFY BELOW ---\nconst fs = require('fs');\ntry {\n  const lines = fs.readFileSync(0, 'utf-8').trim().split('\\n');\n  if (lines.length >= 2) {\n    const nums = JSON.parse(lines[0]);\n    const target = parseInt(lines[1]);\n    console.log(JSON.stringify(twoSum(nums, target)).replace(/\\s/g, ''));\n  }\n} catch (e) {}`,
      python: `import sys\nimport json\ndef twoSum(nums, target):\n    pass\n\n# --- DO NOT MODIFY BELOW ---\ntry:\n    lines = sys.stdin.read().strip().split('\\n')\n    if len(lines) >= 2:\n        nums = json.loads(lines[0])\n        target = int(lines[1])\n        print(json.dumps(twoSum(nums, target)).replace(' ', ''))\nexcept: pass`,
      java: `import java.util.*;\npublic class Main {\n    public static int[] twoSum(int[] nums, int target) {\n        return new int[0];\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if(sc.hasNextLine()) {\n            String l1 = sc.nextLine().replaceAll("[\\\\[\\\\]\\\\s]", "");\n            String[] p = l1.split(",");\n            int[] nums = new int[p.length];\n            for(int i=0; i<p.length; i++) nums[i] = Integer.parseInt(p[i]);\n            int target = sc.nextInt();\n            int[] r = twoSum(nums, target);\n            System.out.println("[" + r[0] + "," + r[1] + "]");\n        }\n    }\n}`,
      cpp: `#include <iostream>\n#include <vector>\n#include <string>\n#include <sstream>\nusing namespace std;\nvector<int> twoSum(vector<int>& nums, int target) {\n    return {};\n}\nint main() {\n    string l1, l2; getline(cin, l1); getline(cin, l2);\n    vector<int> nums;\n    for(char& c : l1) if(c=='[' || c==']' || c==',') c=' ';\n    stringstream ss(l1); int n; while(ss >> n) nums.push_back(n);\n    int target = stoi(l2);\n    vector<int> r = twoSum(nums, target);\n    if(r.size()==2) cout << "[" << r[0] << "," << r[1] << "]\\n";\n    return 0;\n}`
    }
  },
  "reverse-string": {
    id: "reverse-string",
    title: "Reverse String",
    difficulty: "Easy",
    category: "String",
    description: { text: "Write a function that reverses a string. The input string is given as an array of characters s." },
    examples: [],
    constraints: [],
    starterCode: {
      javascript: `function reverseString(s) {\n  \n}\n\n// --- DO NOT MODIFY BELOW ---\nconst fs = require('fs');\ntry {\n  const s = fs.readFileSync(0, 'utf-8').trim().split('');\n  reverseString(s);\n  console.log(s.join(''));\n} catch(e) {}`,
      python: `import sys\ndef reverseString(s):\n    pass\n\n# --- DO NOT MODIFY BELOW ---\ntry:\n    s = list(sys.stdin.read().strip())\n    reverseString(s)\n    print("".join(s))\nexcept: pass`,
      java: `import java.util.*;\npublic class Main {\n    public static void reverseString(char[] s) {\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if(sc.hasNext()) {\n            char[] s = sc.next().toCharArray();\n            reverseString(s);\n            System.out.println(new String(s));\n        }\n    }\n}`,
      cpp: `#include <iostream>\n#include <vector>\n#include <string>\nusing namespace std;\nvoid reverseString(vector<char>& s) {\n}\nint main() {\n    string str; cin >> str;\n    vector<char> s(str.begin(), str.end());\n    reverseString(s);\n    for(char c : s) cout << c;\n    cout << endl;\n    return 0;\n}`
    }
  },
  "valid-palindrome": {
    id: "valid-palindrome",
    title: "Valid Palindrome",
    difficulty: "Easy",
    category: "String",
    description: { text: "Given a string s, return true if it is a palindrome, or false otherwise." },
    examples: [],
    constraints: [],
    starterCode: {
      javascript: `function isPalindrome(s) {\n  \n}\n\n// --- DO NOT MODIFY BELOW ---\nconst fs = require('fs');\ntry {\n  const s = fs.readFileSync(0, 'utf-8').trim();\n  console.log(isPalindrome(s));\n} catch(e) {}`,
      python: `import sys\ndef isPalindrome(s):\n    pass\n\n# --- DO NOT MODIFY BELOW ---\ntry:\n    s = sys.stdin.read().strip()\n    print(str(isPalindrome(s)).lower())\nexcept: pass`,
      java: `import java.util.*;\npublic class Main {\n    public static boolean isPalindrome(String s) {\n        return false;\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if(sc.hasNext()) {\n            System.out.println(isPalindrome(sc.next()));\n        }\n    }\n}`,
      cpp: `#include <iostream>\n#include <string>\nusing namespace std;\nbool isPalindrome(string s) {\n    return false;\n}\nint main() {\n    string str; cin >> str;\n    cout << (isPalindrome(str) ? "true" : "false") << endl;\n    return 0;\n}`
    }
  },
  "maximum-subarray": {
    id: "maximum-subarray",
    title: "Maximum Subarray",
    difficulty: "Medium",
    category: "Array",
    description: { text: "Given an integer array nums, find the subarray with the largest sum, and return its sum." },
    examples: [],
    constraints: [],
    starterCode: {
      javascript: `function maxSubArray(nums) {\n  \n}\n\n// --- DO NOT MODIFY BELOW ---\nconst fs = require('fs');\ntry {\n  const nums = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/).map(Number);\n  console.log(maxSubArray(nums));\n} catch(e) {}`,
      python: `import sys\ndef maxSubArray(nums):\n    pass\n\n# --- DO NOT MODIFY BELOW ---\ntry:\n    nums = list(map(int, sys.stdin.read().strip().split()))\n    print(maxSubArray(nums))\nexcept: pass`,
      java: `import java.util.*;\npublic class Main {\n    public static int maxSubArray(int[] nums) {\n        return 0;\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        List<Integer> list = new ArrayList<>();\n        while(sc.hasNextInt()) list.add(sc.nextInt());\n        int[] nums = new int[list.size()];\n        for(int i=0; i<list.size(); i++) nums[i] = list.get(i);\n        if(nums.length > 0) System.out.println(maxSubArray(nums));\n    }\n}`,
      cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\nint maxSubArray(vector<int>& nums) {\n    return 0;\n}\nint main() {\n    vector<int> nums;\n    int n; while(cin >> n) nums.push_back(n);\n    if(nums.size() > 0) cout << maxSubArray(nums) << endl;\n    return 0;\n}`
    }
  },
  "container-with-most-water": {
    id: "container-with-most-water",
    title: "Container With Most Water",
    difficulty: "Medium",
    category: "Array",
    description: { text: "Find two lines that together with the x-axis form a container, such that the container contains the most water." },
    examples: [],
    constraints: [],
    starterCode: {
      javascript: `function maxArea(height) {\n  \n}\n\n// --- DO NOT MODIFY BELOW ---\nconst fs = require('fs');\ntry {\n  const h = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/).map(Number);\n  console.log(maxArea(h));\n} catch(e) {}`,
      python: `import sys\ndef maxArea(height):\n    pass\n\n# --- DO NOT MODIFY BELOW ---\ntry:\n    h = list(map(int, sys.stdin.read().strip().split()))\n    print(maxArea(h))\nexcept: pass`,
      java: `import java.util.*;\npublic class Main {\n    public static int maxArea(int[] height) {\n        return 0;\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        List<Integer> list = new ArrayList<>();\n        while(sc.hasNextInt()) list.add(sc.nextInt());\n        int[] h = new int[list.size()];\n        for(int i=0; i<list.size(); i++) h[i] = list.get(i);\n        if(h.length > 0) System.out.println(maxArea(h));\n    }\n}`,
      cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\nint maxArea(vector<int>& height) {\n    return 0;\n}\nint main() {\n    vector<int> h;\n    int n; while(cin >> n) h.push_back(n);\n    if(h.size() > 0) cout << maxArea(h) << endl;\n    return 0;\n}`
    }
  }
};

const fileContent = \`export const PROBLEMS = \${JSON.stringify(problems, null, 2)};

export const LANGUAGE_CONFIG = {
  javascript: {
    name: "JavaScript",
    icon: "/javascript.png",
    monacoLang: "javascript",
  },
  python: {
    name: "Python",
    icon: "/python.png",
    monacoLang: "python",
  },
  java: {
    name: "Java",
    icon: "/java.png",
    monacoLang: "java",
  },
  cpp: {
    name: "C++",
    icon: "/cpp.png",
    monacoLang: "cpp",
  },
};\`;

fs.writeFileSync('frontend/src/data/problems.js', fileContent);
