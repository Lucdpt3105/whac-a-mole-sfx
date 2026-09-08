## Specs nâng cấp trò chơi hiện tại
- Hiện tại trò chơi đang có core gameplay cơ bản là đập chuột, nếu đập trúng cây thì thua. Nên tôi đang cần bạn nâng cấp game theo mô tả bên dưới cuả tôi.
- Lưu ý: tôi thay đổi game theo hướng học tập (education) dựa trên gameplay đập chuột
## Mô tả:
- Thứ nhất:
>- thêm hệ thống spawn câu hỏi được lấy từ dataset dạng (json hoặc execel tôi cung cấp). Câu hỏi chính là 1 dạng thử thách để nguời chơi vượt qua nếu muốn chơi tiếp. Câu hỏi chỉ xuất hiện trên một con chuột nếu khi spawn con chuột đó có số được random thuộc (0-20). Nó tồn tại như một mini boss để pass. 
>- hình phạt: mỗi câu hỏi xuất hiện sẽ ở dạng trắc nghiệm được lấy từ dataset (bạn nhớ thiết kế form html giúp tôi đối với mỗi câu hỏi). Câu hỏi có thời gian đếm ngược (10sec), nếu chọn sai hoặc quá giờ, đều tính là wrong-hit (dùng hệ thống sound sfx đã có hiện tại) mà không trừ điểm. Mỗi câu hỏi đều có mức điểm được thiết kế dựa trên độ khó phân cấp từ dễ - khó.
- Thứ hai: độ khó của trò chơi sẽ được áp dụng vào tốc độ spawn chuột và số lượng của cây ăn thịt. Muốn tăng tốc độ và sô lượng cây ăn thịt phải dựa trên số điểm hiện tại của người chơi kiếm được có thỏa mãn điều kiện chia cấp độ theo mức đã được thiết lập sẵn hay không? Do tốc độ tăng dần lên cao nên có khả năng đập hụt chuột nên chỉ tính là đập hụt (wrong-hit) khi đập chậu không có chuột và cây, còn số lượng cây sẽ tăng nên đập trúng cây thì gameover.
## Hiện tại tôi chưa thêm dataset nên bạn hãy tự làm 1 vài câu hỏi trắc nghiệm json nhỏ để đưa vào core game giúp tôi. Những key của json bạn hãy thiết kế luôn để sau tôi chỉ cần thế dataset vào.
